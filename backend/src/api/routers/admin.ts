import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";
import { roleEnumZod } from "@/auth";
import { schema } from "@/db";
import { SelectStudentSchema, SelectTeacherSchema } from "@/db/zod";
import { db } from "@/services";
import { adminProcedure, getAPI, tryAPI } from "../procedure";

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
			z.object({
				id: z.string(),
				role: roleEnumZod,
			}),
		)
		.handler(async ({ input }) => {
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
