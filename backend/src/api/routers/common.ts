import z from "zod";
import { db } from "@/services";
import { protectedProcedure, tryAPI } from "../procedure";

export const commonRouter = {
	getUser: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-common-get-user",
				db.query.user.findFirst({
					where: {
						id: input.id,
					},
				}),
			);
		}),
};
