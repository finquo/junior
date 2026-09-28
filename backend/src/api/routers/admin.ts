import { eq } from "drizzle-orm";
import z from "zod";
import { roleEnumZod } from "@/auth";
import { schema } from "@/db";
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
					.where(input.role ? eq(schema.user.role, input.role) : undefined),
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
};
