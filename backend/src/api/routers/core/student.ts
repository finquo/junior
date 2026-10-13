import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";
import { getAPI, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import {
	SelectStudentSchema,
	SelectUserSchema,
	UpdateStudentSchema,
} from "@/db/zod";
import { db } from "@/services";
import { MapRole } from "@/utils/role";

export const studentRouter = {
	list: getRolesProcedure(["admin", "scheduler", "teacher"]).handler(
		async ({ context }) => {
			return await getAPI(
				"db-core-list-students-query",
				db.query.student.findMany({
					where: MapRole(context.role, {
						admin: {},
						scheduler: {
							supervisorId: context.user.id,
						},
						teacher: {
							mentorId: context.user.id,
						},
					}),
					orderBy: { createdAt: "desc" },
					with: {
						user: true,
					},
				}),
				[],
			);
		},
	),
	get: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-get-student",
				db.query.student.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.id,
						},
						teacher: {
							id: input.id,
							mentorId: context.user.id,
						},
						scheduler: {
							id: input.id,
							supervisorId: context.user.id,
						},
					}),
					with: {
						user: true,
					},
				}),
			);
		}),
	search: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			SelectUserSchema.pick({ name: true }).extend({
				searchQuery: SelectUserSchema.shape.name
					.min(3, { message: "Type at least 3 letters" })
					.optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const query = input.searchQuery || input.name;
			return await getAPI(
				"db-core-search-students-query",
				db
					.select()
					.from(schema.student)
					.innerJoin(schema.user, eq(schema.student.id, schema.user.id))
					.where(
						and(
							MapRole(context.role, {
								admin: undefined,
								scheduler: eq(schema.student.supervisorId, context.user.id),
								teacher: eq(schema.student.mentorId, context.user.id),
							}),
							query ? sql`${schema.user.name} % ${query}` : undefined,
						),
					)
					.orderBy(
						query
							? sql`similarity(${schema.user.name}, ${query}) DESC`
							: desc(schema.student.createdAt),
					),
				[],
			);
		}),
	getLessons: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const data = await tryAPI(
				"db-core-get-student-lessons",
				db.query.student.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.id,
						},
						teacher: {
							id: input.id,
							mentorId: context.user.id,
						},
						scheduler: {
							id: input.id,
							supervisorId: context.user.id,
						},
					}),
					columns: {
						lessons: true,
					},
				}),
			);

			return data?.lessons;
		}),
	update: getRolesProcedure(["admin", "scheduler"])
		.input(
			UpdateStudentSchema.omit({
				createdAt: true,
				updatedAt: true,
			}).required({
				id: true,
			}),
		)
		.handler(async ({ input, context }) => {
			const { id, ...data } = input;

			return await tryAPI(
				"db-core-update-student",
				db
					.update(schema.student)
					.set(data)
					.where(
						MapRole(context.role, {
							admin: eq(schema.student.id, id),
							scheduler: and(
								eq(schema.student.id, id),
								eq(schema.student.supervisorId, context.user.id),
							),
						}),
					)
					.returning(),
			);
		}),
	updateLessons: getRolesProcedure(["admin", "scheduler"])
		.input(
			SelectStudentSchema.pick({
				id: true,
				lessons: true,
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-update-student-lessons",
				db
					.update(schema.student)
					.set({
						lessons: input.lessons,
					})
					.where(
						MapRole(context.role, {
							admin: eq(schema.student.id, input.id),
							scheduler: and(
								eq(schema.student.id, input.id),
								eq(schema.student.supervisorId, context.user.id),
							),
						}),
					)
					.returning(),
			);
		}),
};
