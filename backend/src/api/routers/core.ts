import z from "zod";
import { schema } from "@/db";
import { db } from "@/services";
import {
	getAPI,
	getRolesProcedure,
	protectedProcedure,
	tryAPI,
} from "../procedure";

export const coreRouter = {
	getUser: protectedProcedure
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
	getStudent: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-get-student",
				db.query.user.findFirst({
					where: {
						id: input.id,
					},
					with: {
						studentData: true,
					},
				}),
			);
		}),
	getStudentLessons: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const data = await tryAPI(
				"db-core-get-student",
				db.query.user.findFirst({
					where: {
						id: input.id,
					},
					columns: {},
					with: {
						studentData: {
							columns: {
								lessons: true,
							},
						},
					},
				}),
			);

			return data?.studentData?.lessons;
		}),
	getLessons: getRolesProcedure(["admin", "teacher", "scheduler"]).handler(() =>
		getAPI(
			"db-core-get-lessons-query",
			db.query.lesson.findMany({
				orderBy: {
					createdAt: "desc",
				},
			}),
			[],
		),
	),
};
