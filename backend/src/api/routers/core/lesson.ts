import { desc, eq, sql } from "drizzle-orm";
import z from "zod";
import { getAPI, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import { ArrayAppend } from "@/db/utils";
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
				db.transaction(async (tx) => {
					const lessons = await tx
						.insert(schema.lesson)
						.values(input)
						.returning();

					const lesson = lessons[0];

					if (lesson && input.program) {
						await tx
							.update(schema.program)
							.set({
								lessons: ArrayAppend(schema.program.lessons, lesson.id),
							})
							.where(eq(schema.program.id, input.program));
					}

					return lessons;
				}),
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
};
