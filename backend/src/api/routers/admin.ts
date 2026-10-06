import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";
import { roleEnumZod } from "@/auth";
import { schema } from "@/db";
import { SelectStudentSchema, SelectTeacherSchema } from "@/db/zod";
import { db } from "@/services";
import { adminProcedure, getAPI, getError, tryAPI } from "../procedure";

export const adminRouter = {
	getUsers: adminProcedure
		.input(
			z
				.object({
					searchQuery: z
						.string({ error: "Search text is required" })
						.min(3, { message: "Type at least 3 letters" }),
					role: roleEnumZod,
				})
				.partial(),
		)
		.handler(async ({ input }) => {
			return await getAPI(
				"db-admin-get-user-query",
				db
					.select()
					.from(schema.user)
					.where(
						and(
							input.role ? eq(schema.user.role, input.role) : undefined,
							input.searchQuery
								? sql`${schema.user.name} % ${input.searchQuery}`
								: undefined,
						),
					)
					.orderBy(
						input.searchQuery
							? sql`similarity(${schema.user.name}, ${input.searchQuery}) DESC`
							: desc(schema.user.createdAt),
					),
				[],
			);
		}),
	promote: adminProcedure
		.input(
			z
				.object({
					id: z.string(),
					role: roleEnumZod,
				})
				.and(
					z.union([
						z.object({
							role: z.literal("teacher"),
							supervisorId: z.string(),
						}),
						z.object({
							role: z.literal("student"),
							mentorId: z.string(),
							supervisorId: z.string(),
						}),
						z.object({
							role: roleEnumZod.exclude(["teacher", "student"]),
						}),
					]),
				),
		)
		.handler(async ({ input }) => {
			const existingUser = await tryAPI(
				"db-admin-get-user-role",
				db.query.user.findFirst({
					where: {
						id: input.id,
					},
					columns: {
						role: true,
					},
				}),
			);

			if (!existingUser) throw getError("NOT_FOUND", "User not found");

			const oldRole = existingUser.role;

			if (oldRole !== input.role) {
				if (oldRole === "teacher") {
					await tryAPI(
						"db-admin-delete-teacher",
						db.delete(schema.teacher).where(eq(schema.teacher.id, input.id)),
					);
				} else if (oldRole === "student") {
					await tryAPI(
						"db-admin-delete-student",
						db.delete(schema.student).where(eq(schema.student.id, input.id)),
					);
				} else if (oldRole === "scheduler") {
					await tryAPI(
						"db-admin-delete-scheduler",
						db
							.delete(schema.scheduler)
							.where(eq(schema.scheduler.id, input.id)),
					);
				}

				if (input.role === "teacher") {
					await tryAPI(
						"db-admin-create-teacher",
						db.insert(schema.teacher).values({
							id: input.id,
							supervisorId: input.supervisorId,
						}),
					);
				} else if (input.role === "student") {
					await tryAPI(
						"db-admin-create-student",
						db.insert(schema.student).values({
							id: input.id,
							mentorId: input.mentorId,
							supervisorId: input.supervisorId,
						} as any),
					);
				} else if (input.role === "scheduler") {
					await tryAPI(
						"db-admin-create-scheduler",
						db.insert(schema.scheduler).values({ id: input.id }),
					);
				}
			}

			return await tryAPI(
				"db-admin-promote-user-update",
				db
					.update(schema.user)
					.set({
						role: input.role,
					})
					.where(eq(schema.user.id, input.id))
					.returning(),
			);
		}),
	getSlots: adminProcedure.handler(async () => {
		return await getAPI(
			"db-admin-get-slots-query",
			db.select().from(schema.slot),
			[],
		);
	}),
	updateTeacher: adminProcedure
		.input(
			SelectTeacherSchema.pick({
				id: true,
				supervisorId: true,
			}),
		)
		.handler(async ({ input }) => {
			const { id, ...data } = input;
			return await tryAPI(
				"db-admin-update-teacher",
				db
					.update(schema.teacher)
					.set(data)
					.where(eq(schema.teacher.id, id))
					.returning(),
			);
		}),
	updateStudent: adminProcedure
		.input(
			SelectStudentSchema.pick({
				id: true,
				mentorId: true,
				meetingLink: true,
				supervisorId: true,
			}),
		)
		.handler(async ({ input }) => {
			const { id, ...data } = input;
			return await tryAPI(
				"db-admin-update-student",
				db
					.update(schema.student)
					.set(data)
					.where(eq(schema.student.id, id))
					.returning(),
			);
		}),
};
