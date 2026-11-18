import { eq } from "drizzle-orm";
import z from "zod";
import {
	getAPI,
	getRolesProcedure,
	publicProcedure,
	tryAPI,
} from "@/api/procedure";
import { schema } from "@/db";
import { FeedbackStatusZod, InsertFeedbackSchema } from "@/db/zod";
import { db } from "@/services";

export const feedbackRouter = {
	list: getRolesProcedure(["admin", "scheduler"]).handler(async () => {
		return await getAPI(
			"db-core-list-feedback",
			db.query.feedback.findMany({
				with: {
					user: true,
				},
			}),
			[],
		);
	}),
	get: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-get-feedback",
				db.query.feedback.findFirst({
					where: {
						id: input.id,
					},
					with: {
						user: true,
					},
				}),
			);
		}),
	resolve: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
				status: FeedbackStatusZod,
			}),
		)
		.handler(async ({ context, input }) => {
			return await tryAPI(
				"db-core-resolve-feedback",
				db
					.update(schema.feedback)
					.set({ status: input.status, resolvedBy: context.user.id })
					.where(eq(schema.feedback.id, input.id))
					.returning(),
			);
		}),
	addFeedback: publicProcedure
		.input(
			InsertFeedbackSchema.pick({
				content: true,
				type: true,
				ref: true,
				userId: true,
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-common-add-feedback",
				db
					.insert(schema.feedback)
					.values({
						content: input.content,
						type: input.type,
						ref: input.ref ?? null,
						userId: input.userId ?? null,
					})
					.returning(),
			);
		}),
};
