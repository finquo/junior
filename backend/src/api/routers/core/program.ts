import z from "zod";
import { getAPI, getError, getRolesProcedure } from "@/api/procedure";
import { ProgramZod, programs } from "@/config";
import { db } from "@/services";
import { MapRole } from "@/utils/role";

export const programRouter = {
	list: getRolesProcedure(["admin", "scheduler", "teacher"]).handler(
		() => programs,
	),
	get: getRolesProcedure(["admin", "scheduler", "teacher"])
		.input(
			z.object({
				id: ProgramZod,
			}),
		)
		.handler(({ input }) => {
			const program = programs.find((p) => p.id === input.id);

			if (!program) throw getError("NOT_FOUND", "Program not found");

			return program;
		}),
	students: getRolesProcedure(["admin", "scheduler", "teacher"])
		.input(
			z.object({
				id: ProgramZod,
			}),
		)
		.handler(async ({ input, context }) => {
			return await getAPI(
				"db-core-get-program-students",
				db.query.student.findMany({
					where: MapRole(context.role, {
						admin: {
							program: input.id,
						},
						scheduler: {
							program: input.id,
							supervisorId: context.user.id,
						},
						teacher: {
							program: input.id,
							mentorId: context.user.id,
						},
					}),
					orderBy: { createdAt: "desc" },
					with: {
						user: true,
					},
				}),
				[],
			);
		}),
	lessons: getRolesProcedure(["admin", "scheduler", "teacher"])
		.input(
			z.object({
				id: ProgramZod,
			}),
		)
		.handler(async ({ input }) => {
			return await getAPI(
				"db-core-get-program-lessons",
				db.query.lesson.findMany({
					where: {
						program: input.id,
					},
					orderBy: { createdAt: "desc" },
				}),
				[],
			);
		}),
};
