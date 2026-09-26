import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { db } from "@/services";
import { checkPermission, getAPI } from "../procedure";

export const enrollmentRouter = {
	createAccount: checkPermission("student", "update").handler(
		async ({ context }) => {
			return await getAPI(
				"db-enrollment-update-students",
				db
					.select()
					.from(schema.student)
					.where(eq(schema.student.supervisorId, context.user.id)),
				[],
			);
		},
	),
};
