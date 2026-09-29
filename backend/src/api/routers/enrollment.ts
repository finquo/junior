import z from "zod";
import { roleEnumZod } from "@/auth";
import { auth } from "@/services";
import { enrollmentAdvisorProcedure, tryAPI } from "../procedure";

export const enrollmentRouter = {
	createAccount: enrollmentAdvisorProcedure
		.input(
			z.object({
				name: z.string(),
				email: z.email(),
				password: z.string().default("1234567890"),
				role: roleEnumZod.optional(),
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-enrollment-create-students",
				auth.api.createUser({
					body: input,
				}),
			);
		}),
};
