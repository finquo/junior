import z from "zod";
import { Countries, Currencies, Languages } from "@/config";
import { db } from "@/services";
import { protectedProcedure, publicProcedure, tryAPI } from "../procedure";

export const commonRouter = {
	getMe: protectedProcedure.handler(async ({ context }) => {
		const user = await tryAPI(
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

		if (user) {
			switch (user.role) {
				case "student":
					return {
						...user,
						data: user["studentData"],
						role: "student",
					} as const;
				case "teacher":
					return {
						...user,
						data: user["teacherData"],
						role: "teacher",
					} as const;
				case "scheduler":
					return {
						...user,
						data: user["schedulerData"],
						role: "scheduler",
					} as const;
			}
		}
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
	getLesson: protectedProcedure
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-common-get-lesson",
				db.query.lesson.findFirst({
					where: {
						id: input.id,
					},
				}),
			);
		}),
	getLanguages: publicProcedure.handler(() => Languages),
	getCountries: publicProcedure.handler(() => Countries),
	getCurrencies: publicProcedure.handler(() => Currencies),
};
