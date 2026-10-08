import { and, desc, eq, sql } from "drizzle-orm";
import { schema } from "@/db";
import { SelectUserSchema } from "@/db/zod";
import { db } from "@/services";
import { getAPI, schedulerProcedure, tryAPI } from "../procedure";

export const schedulerRouter = {
	get: schedulerProcedure.handler(async ({ context }) => {
		return await tryAPI(
			"db-get-scheduler-query",
			db
				.select()
				.from(schema.scheduler)
				.where(eq(schema.scheduler.id, context.user.id)),
		);
	}),
	getStudents: schedulerProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-scheduler-get-students-query",
			db
				.select()
				.from(schema.student)
				.where(eq(schema.student.supervisorId, context.user.id))
				.orderBy(desc(schema.student.createdAt)),
			[],
		);
	}),
	searchStudents: schedulerProcedure
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
				"db-scheduler-search-students-query",
				db
					.select()
					.from(schema.student)
					.innerJoin(schema.user, eq(schema.student.id, schema.user.id))
					.where(
						and(
							eq(schema.student.supervisorId, context.user.id),
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
};
