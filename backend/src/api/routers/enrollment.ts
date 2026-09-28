import z from "zod";
import { roleEnumZod } from "@/config";
import { auth } from "@/services";
import { checkPermission, tryAPI } from "../procedure";

export const enrollmentRouter = {
	createAccount: checkPermission("student", "create")
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
