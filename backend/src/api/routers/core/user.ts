import { or, sql } from "drizzle-orm";
import z from "zod";
import { getAPI, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import { InsertUserSchema } from "@/db/zod";
import { auth, db } from "@/services";

export const userRouter = {
	getUser: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-get-user",
				db.query.user.findFirst({
					where: {
						id: input.id,
					},
					with: {
						schedulerData: true,
						teacherData: true,
						studentData: true,
					},
				}),
			);
		}),
	search: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				query: z.string().min(3, { message: "Type at least 3 letters" }),
			}),
		)
		.handler(async ({ input: { query } }) => {
			return await getAPI(
				"db-core-search-users-query",
				db
					.select()
					.from(schema.user)
					.where(
						or(
							sql`${schema.user.name} % ${query}`,
							sql`${schema.user.email} % ${query}`,
						),
					)
					.orderBy(
						sql`GREATEST(similarity(${schema.user.name}, ${query}), similarity(${schema.user.email}, ${query})) DESC`,
					),
				[],
			);
		}),
	createAccount: getRolesProcedure(["admin", "enrollment_advisor"])
		.input(
			InsertUserSchema.pick({
				name: true,
				email: true,
				phoneNumber: true,
			}).extend({
				password: z.string().default("1234567890"),
			}),
		)
		.handler(async ({ input }) => {
			const { phoneNumber, ...body } = input;

			return await tryAPI(
				"db-core-create-account",
				auth.api.createUser({
					body: {
						...body,
						data: { phoneNumber },
					},
				}),
			);
		}),
};
