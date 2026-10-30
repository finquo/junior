import { desc, eq, sql } from "drizzle-orm";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import { InsertUserSchema } from "@/db/zod";
import { auth, db } from "@/services";
import { MapRole } from "@/utils/role";

export const schedulerRouter = {
	list: getRolesProcedure(["admin"]).handler(async ({ context }) => {
		return await getAPI(
			"db-core-get-schedulers-query",
			db.query.scheduler.findMany({
				where: MapRole(context.role, {
					admin: {},
				}),
				orderBy: { createdAt: "desc" },
				with: {
					user: true,
				},
			}),
			[],
		);
	}),
	get: getRolesProcedure(["admin"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-get-scheduler",
				db.query.scheduler.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.id,
						},
					}),
					with: {
						user: true,
					},
				}),
			);
		}),
	search: getRolesProcedure(["admin"])
		.input(
			z.object({
				query: z.string().min(3, { message: "Type at least 3 letters" }),
			}),
		)
		.handler(async ({ input: { query }, context }) => {
			return await getAPI(
				"db-core-search-schedulers-query",
				db
					.select()
					.from(schema.scheduler)
					.innerJoin(schema.user, eq(schema.scheduler.id, schema.user.id))
					.where(query ? sql`${schema.user.name} % ${query}` : undefined)
					.orderBy(
						query
							? sql`similarity(${schema.user.name}, ${query}) DESC`
							: desc(schema.scheduler.createdAt),
					),
				[],
			);
		}),
	getSlots: getRolesProcedure(["admin"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await getAPI(
				"db-core-get-scheduler-slots",
				db
					.select()
					.from(schema.slot)
					.where(
						MapRole(context.role, {
							admin: eq(schema.slot.schedulerId, input.id),
						}),
					),
				[],
			);
		}),
	create: getRolesProcedure(["admin"])
		.input(
			z.object({
				user: InsertUserSchema.pick({
					name: true,
					email: true,
					phoneNumber: true,
				}),
				password: z
					.string()
					.min(6, "Password must be at least 6 characters")
					.default("1234567890"),
			}),
		)
		.handler(async ({ input }) => {
			const { user, password } = input;

			const createdUser = await tryAPI(
				"db-core-create-scheduler-account",
				auth.api.createUser({
					body: {
						name: user.name,
						email: user.email,
						password,
						role: "scheduler",
						data: {
							phoneNumber: user.phoneNumber,
							phoneNumberVerified: false,
						},
					},
				}),
			);

			if (!createdUser?.user) {
				throw getError(
					"INTERNAL_SERVER_ERROR",
					"Failed to create scheduler account",
				);
			}

			await tryAPI(
				"db-core-create-scheduler",
				db
					.insert(schema.scheduler)
					.values({ id: createdUser.user.id })
					.onConflictDoNothing(),
			);

			return createdUser.user;
		}),
};
