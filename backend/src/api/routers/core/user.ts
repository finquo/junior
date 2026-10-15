import { or, sql } from "drizzle-orm";
import z from "zod";
import { getAPI, getRolesProcedure, tryAPI } from "@/api/procedure";
import { roleEnumZod } from "@/auth";
import { schema } from "@/db";
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
			z.object({
				name: z.string(),
				email: z.email(),
				password: z.string().default("1234567890"),
				role: roleEnumZod.default("user"),
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-create-account",
				auth.api.createUser({
					body: input,
				}),
			);
		}),
};
