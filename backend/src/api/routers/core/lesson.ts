import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";
import {
	getAPI,
	getError,
	getRolesProcedure,
	publicProcedure,
	tryAPI,
} from "@/api/procedure";
import { anwserZod, quizSubmitZod, quizZod } from "@/config/quiz";
import { schema } from "@/db";
import {
	InsertLessonSchema,
	SelectLessonSchema,
	UpdateLessonSchema,
} from "@/db/zod";
import { db } from "@/services";

export const lessonRouter = {
	list: getRolesProcedure([
		"admin",
		"teacher",
		"scheduler",
		"qa_auditor",
	]).handler(() =>
		getAPI(
			"db-core-get-lessons-query",
			db.query.lesson.findMany({
				orderBy: {
					createdAt: "desc",
				},
			}),
			[],
		),
	),
	get: getRolesProcedure([
		"admin",
		"teacher",
		"scheduler",
		"student",
		"qa_auditor",
	])
		.input(SelectLessonSchema.pick({ id: true }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-get-lesson",
				db.query.lesson.findFirst({
					where: {
						id: input.id,
					},
					with: {
						programInfo: true,
					},
				}),
			);
		}),
	search: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				query: z.string().min(3, { message: "Type at least 3 letters" }),
			}),
		)
		.handler(async ({ input: { query } }) => {
			return await getAPI(
				"db-core-search-lessons-query",
				db
					.select()
					.from(schema.lesson)
					.where(query ? sql`${schema.lesson.name} % ${query}` : undefined)
					.orderBy(
						query
							? sql`similarity(${schema.lesson.name}, ${query}) DESC`
							: desc(schema.lesson.createdAt),
					),
				[],
			);
		}),
	create: getRolesProcedure(["admin", "scheduler"])
		.input(
			InsertLessonSchema.omit({
				id: true,
				quiz: true,
				createdAt: true,
				updatedAt: true,
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-create-lesson",
				db.insert(schema.lesson).values(input).returning(),
			);
		}),
	update: getRolesProcedure(["admin", "scheduler"])
		.input(
			UpdateLessonSchema.required({
				id: true,
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-update-lesson",
				db
					.update(schema.lesson)
					.set(input)
					.where(eq(schema.lesson.id, input.id))
					.returning(),
			);
		}),
	quiz: publicProcedure
		.input(
			z.object({
				lessonId: z.string(),
				quizIds: z.array(z.string()).min(1),
			}),
		)
		.handler(async ({ input }) => {
			const lesson = await tryAPI(
				"db-core-quiz-lesson",
				db.query.lesson.findFirst({
					where: { id: input.lessonId },
					columns: { quiz: true },
				}),
			);
			if (!lesson) throw getError("NOT_FOUND", "Lesson not found");

			return (lesson.quiz ?? [])
				.filter((question) => input.quizIds.includes(question.id))
				.map(({ anwser: _anwser, ...question }) => question);
		}),
	answers: getRolesProcedure(["student", "teacher", "admin", "scheduler"])
		.input(z.object({ slotId: z.string() }))
		.handler(async ({ input, context }) => {
			const slot = await tryAPI(
				"db-core-quiz-answers-slot",
				db.query.slot.findFirst({
					where: { id: input.slotId },
					columns: { studentId: true, teacherId: true, lessonId: true },
				}),
			);
			const isMine =
				context.user.id === slot?.studentId ||
				context.user.id === slot?.teacherId;

			if (!slot || !isMine)
				throw getError("FORBIDDEN", "You cannot view these answers");

			return await getAPI(
				"db-core-quiz-answers",
				db
					.select()
					.from(schema.answer)
					.where(
						and(
							eq(schema.answer.studentId, slot.studentId),
							eq(schema.answer.lessonId, slot.lessonId),
						),
					)
					.orderBy(schema.answer.createdAt),
				[],
			);
		}),
	submit: getRolesProcedure(["student"])
		.input(
			z.object({
				slotId: z.string(),
				lessonId: z.string(),
				answers: quizSubmitZod,
			}),
		)
		.handler(async ({ input, context }) => {
			const slot = await tryAPI(
				"db-core-quiz-submit-slot",
				db.query.slot.findFirst({
					where: { id: input.slotId },
					columns: { studentId: true, lessonId: true },
				}),
			);
			if (
				!slot ||
				slot.studentId !== context.user.id ||
				slot.lessonId !== input.lessonId
			)
				throw getError("FORBIDDEN", "You cannot answer this quiz");

			const lesson = await tryAPI(
				"db-core-quiz-submit-lesson",
				db.query.lesson.findFirst({
					where: { id: input.lessonId },
					columns: { quiz: true },
				}),
			);
			const questions = lesson?.quiz ?? [];

			for (const item of input.answers) {
				const question = questions.find((q) => q.id === item.questionId);
				if (!question)
					throw getError("BAD_REQUEST", `Unknown question ${item.questionId}`);

				const answer = anwserZod.parse({
					id: crypto.randomUUID(),
					questionId: item.questionId,
					type: question.type,
					anwser: item.anwser,
				});

				const existing = await tryAPI(
					"db-core-quiz-submit-find",
					db
						.select({ id: schema.answer.id })
						.from(schema.answer)
						.where(
							and(
								eq(schema.answer.studentId, context.user.id),
								eq(schema.answer.lessonId, input.lessonId),
								sql`${schema.answer.answer}->>'questionId' = ${item.questionId}`,
							),
						)
						.limit(1),
					[],
				);

				const match = existing?.[0];

				if (match) {
					await tryAPI(
						"db-core-quiz-submit-update",
						db
							.update(schema.answer)
							.set({ answer, status: "answered" })
							.where(eq(schema.answer.id, match.id)),
					);
				} else {
					await tryAPI(
						"db-core-quiz-submit-insert",
						db.insert(schema.answer).values({
							studentId: context.user.id,
							lessonId: input.lessonId,
							status: "answered",
							answer,
						}),
					);
				}
			}
		}),
	grade: getRolesProcedure(["teacher"])
		.input(
			z.object({
				slotId: z.string(),
				answerId: z.string(),
				status: z.enum(["correct", "partially_correct", "wrong"]),
			}),
		)
		.handler(async ({ input, context }) => {
			const slot = await tryAPI(
				"db-core-quiz-grade-slot",
				db.query.slot.findFirst({
					where: { id: input.slotId },
					columns: { studentId: true, teacherId: true, lessonId: true },
				}),
			);
			if (!slot || slot.teacherId !== context.user.id)
				throw getError("FORBIDDEN", "You cannot grade this answer");

			await tryAPI(
				"db-core-quiz-grade-update",
				db
					.update(schema.answer)
					.set({ status: input.status })
					.where(
						and(
							eq(schema.answer.id, input.answerId),
							eq(schema.answer.studentId, slot.studentId ?? ""),
							eq(schema.answer.lessonId, slot.lessonId),
						),
					),
			);
		}),
	retake: getRolesProcedure(["teacher", "scheduler", "admin"])
		.input(
			z.object({
				slotId: z.string(),
				questionIds: z.array(z.string()).min(1),
			}),
		)
		.handler(async ({ input, context }) => {
			const slot = await tryAPI(
				"db-core-quiz-retake-slot",
				db.query.slot.findFirst({
					where: { id: input.slotId },
					columns: { studentId: true, teacherId: true, lessonId: true },
				}),
			);
			if (!slot || slot.teacherId !== context.user.id)
				throw getError("FORBIDDEN", "You cannot retake this quiz");

			for (const questionId of input.questionIds) {
				await tryAPI(
					"db-core-quiz-retake-update",
					db
						.update(schema.answer)
						.set({ status: "retake" })
						.where(
							and(
								eq(schema.answer.studentId, slot.studentId ?? ""),
								eq(schema.answer.lessonId, slot.lessonId),
								sql`${schema.answer.answer}->>'questionId' = ${questionId}`,
							),
						),
				);
			}
		}),
	appendQuiz: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
				quiz: quizZod,
			}),
		)
		.handler(async ({ input }) => {
			const lesson = await tryAPI(
				"db-core-get-lesson-quiz",
				db.query.lesson.findFirst({
					where: { id: input.id },
					columns: { quiz: true },
				}),
			);

			if (!lesson) return null;

			return await tryAPI(
				"db-core-append-lesson-quiz",
				db
					.update(schema.lesson)
					.set({
						quiz: [...(lesson.quiz ?? []), input.quiz],
					})
					.where(eq(schema.lesson.id, input.id))
					.returning(),
			);
		}),
	updateQuiz: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
				quiz: quizZod,
			}),
		)
		.handler(async ({ input }) => {
			const lesson = await tryAPI(
				"db-core-get-lesson-quiz",
				db.query.lesson.findFirst({
					where: { id: input.id },
					columns: { quiz: true },
				}),
			);

			if (!lesson) return null;

			return await tryAPI(
				"db-core-update-lesson-quiz",
				db
					.update(schema.lesson)
					.set({
						quiz: (lesson.quiz ?? []).map((question) =>
							question.id === input.quiz.id ? input.quiz : question,
						),
					})
					.where(eq(schema.lesson.id, input.id))
					.returning(),
			);
		}),
	deleteQuiz: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
				quizId: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const lesson = await tryAPI(
				"db-core-get-lesson-quiz",
				db.query.lesson.findFirst({
					where: { id: input.id },
					columns: { quiz: true },
				}),
			);

			if (!lesson) return null;

			return await tryAPI(
				"db-core-delete-lesson-quiz",
				db
					.update(schema.lesson)
					.set({
						quiz: (lesson.quiz ?? []).filter(
							(question) => question.id !== input.quizId,
						),
					})
					.where(eq(schema.lesson.id, input.id))
					.returning(),
			);
		}),
};
