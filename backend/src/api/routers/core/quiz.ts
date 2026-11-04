import { and, eq, sql } from "drizzle-orm";
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
import { db } from "@/services";

export const quizRouter = {
	get: publicProcedure
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
	studentAnswers: getRolesProcedure(["teacher", "scheduler", "admin"])
		.input(z.object({ studentId: z.string() }))
		.handler(async ({ input }) => {
			return await getAPI(
				"db-core-quiz-student-answers",
				db
					.select({
						id: schema.answer.id,
						status: schema.answer.status,
						answer: schema.answer.answer,
						createdAt: schema.answer.createdAt,
						updatedAt: schema.answer.updatedAt,
						lessonId: schema.lesson.id,
						lessonName: schema.lesson.name,
						quiz: schema.lesson.quiz,
					})
					.from(schema.answer)
					.innerJoin(schema.lesson, eq(schema.answer.lessonId, schema.lesson.id))
					.where(eq(schema.answer.studentId, input.studentId))
					.orderBy(schema.answer.createdAt),
				[],
			);
		}),
	grade: getRolesProcedure(["teacher", "scheduler", "admin"])
		.input(
			z.object({
				studentId: z.string(),
				lessonId: z.string(),
				answerId: z.string(),
				status: z.enum(["correct", "partially_correct", "wrong"]),
			}),
		)
		.handler(async ({ input }) => {
			await tryAPI(
				"db-core-quiz-grade-update",
				db
					.update(schema.answer)
					.set({ status: input.status })
					.where(
						and(
							eq(schema.answer.id, input.answerId),
							eq(schema.answer.studentId, input.studentId),
							eq(schema.answer.lessonId, input.lessonId),
						),
					),
			);
		}),
	retake: getRolesProcedure(["teacher", "scheduler", "admin"])
		.input(
			z.object({
				studentId: z.string(),
				lessonId: z.string(),
				questionIds: z.array(z.string()).min(1),
			}),
		)
		.handler(async ({ input }) => {
			for (const questionId of input.questionIds) {
				await tryAPI(
					"db-core-quiz-retake-update",
					db
						.update(schema.answer)
						.set({ status: "retake" })
						.where(
							and(
								eq(schema.answer.studentId, input.studentId),
								eq(schema.answer.lessonId, input.lessonId),
								sql`${schema.answer.answer}->>'questionId' = ${questionId}`,
							),
						),
				);
			}
		}),
	create: getRolesProcedure(["admin", "scheduler"])
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
	update: getRolesProcedure(["admin", "scheduler"])
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
	delete: getRolesProcedure(["admin", "scheduler"])
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
