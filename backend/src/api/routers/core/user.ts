import z from "zod";
import { getRolesProcedure, tryAPI } from "@/api/procedure";
import { roleEnumZod } from "@/auth";
import { auth, db } from "@/services";

export const userRouter = {
	getUser: getRolesProcedure(["admin", "teacher", "scheduler"])
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
	createAccount: getRolesProcedure(["admin", "enrollment_advisor"])
		.input(
			z.object({
				name: z.string(),
				email: z.email(),
				password: z.string().default("1234567890"),
				role: roleEnumZod.default("user"),
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-create-account",
				auth.api.createUser({
					body: input,
				}),
			);
		}),
};
