import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { db } from "@/services";
import { getAPI, schedulerProcedure, tryAPI } from "../procedure";

export const schedulerRouter = {
	get: schedulerProcedure.handler(async ({ context }) => {
		return await tryAPI(
			"db-get-scheduler-query",
			db
				.select()
				.from(schema.scheduler)
				.where(eq(schema.scheduler.id, context.user.id)),
		);
	}),
	getTeachers: schedulerProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-scheduler-get-teachers-query",
			db
				.select()
				.from(schema.teacher)
				.where(eq(schema.teacher.supervisorId, context.user.id)),
			[],
		);
	}),
	getStudents: schedulerProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-scheduler-get-students-query",
			db
				.select()
				.from(schema.student)
				.where(eq(schema.student.supervisorId, context.user.id)),
			[],
		);
	}),
	getSlots: schedulerProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-scheduler-get-slots-query",
			db
				.select()
				.from(schema.slot)
				.where(eq(schema.slot.schedulerId, context.user.id)),
			[],
		);
	}),
};
