import { desc, eq, sql } from "drizzle-orm";
import z from "zod";
import { getAPI, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import { SelectUserSchema } from "@/db/zod";
import { db } from "@/services";
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
};
