import z from "zod";
import { Countries, Currencies, Languages } from "@/config";
import { db } from "@/services";
import { protectedProcedure, publicProcedure, tryAPI } from "../procedure";

export const commonRouter = {
	getMe: protectedProcedure
		.handler(async ({ context }) => {
			return await tryAPI(
				"db-common-get-user",
				db.query.user.findFirst({
					where: {
						id: context.user.id,
					},
					with: {
						schedulerData: true,
						teacherData: true,
						studentData: true,
					},
				}),
			);
		}),
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
					with: {
						schedulerData: true,
						teacherData: true,
						studentData: true,
					},
				}),
			);
		}),

	getLanguages: publicProcedure.handler(() => Languages),
	getCountries: publicProcedure.handler(() => Countries),
	getCurrencies: publicProcedure.handler(() => Currencies),
};
