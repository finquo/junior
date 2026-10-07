import { and, eq } from "drizzle-orm";
import z from "zod";
import { getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import { SelectStudentSchema, UpdateStudentSchema } from "@/db/zod";
import { db } from "@/services";
import { MapRole } from "@/utils/role";

export const studentRouter = {
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
				supervisorId: true,
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
