import { eq } from "drizzle-orm";
import { Countries, Currencies, Languages, PhoneNumberZod } from "utils";
import z from "zod";
import { schema } from "@/db";
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
			// Demo sandbox lesson. Remove this branch before deploying.
			if (input.id === "demo") {
				const now = new Date();

				return {
					id: "demo",
					name: "Demo lesson",
					description: "A sample lesson for the demo meeting.",
					language: "en-IN",
					program: null,
					quiz: null,
					period: "0 hours 45 minutes",
					createdAt: now,
					updatedAt: now,
					programInfo: null,
				} as const;
			}

			return await tryAPI(
				"db-common-get-lesson",
				db.query.lesson.findFirst({
					where: {
						id: input.id,
					},
					with: {
						programInfo: true,
					},
				}),
			);
		}),
	updatePhoneNumber: protectedProcedure
		.input(
			z.object({
				phoneNumber: PhoneNumberZod.nullable(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-common-update-phone-number",
				db
					.update(schema.user)
					.set({
						phoneNumber: input.phoneNumber,
						phoneNumberVerified: false,
					})
					.where(eq(schema.user.id, context.user.id))
					.returning(),
			);
		}),
	getLanguages: publicProcedure.handler(() => Languages),
	getCountries: publicProcedure.handler(() => Countries),
	getCurrencies: publicProcedure.handler(() => Currencies),
};
