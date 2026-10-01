import { eq } from "drizzle-orm";
import z from "zod";
import { availabilityZod, dateLeave, timeLeave } from "@/config/time";
import { schema } from "@/db";
import { db } from "@/services";
import { getAPI, teacherProcedure, tryAPI } from "../procedure";

export const teacherRouter = {
	get: teacherProcedure.handler(async ({ context }) => {
		return await tryAPI(
			"db-get-teacher-query",
			db
				.select()
				.from(schema.teacher)
				.where(eq(schema.teacher.id, context.user.id)),
		);
	}),
	getSupervisor: teacherProcedure.handler(async ({ context }) => {
		const supervisorId = db
			.select({
				supervisorId: schema.teacher.supervisorId,
			})
			.from(schema.teacher)
			.where(eq(schema.teacher.id, context.user.id));

		return await tryAPI(
			"db-teacher-get-supervisor-query",
			db
				.select()
				.from(schema.scheduler)
				.where(eq(schema.scheduler.id, supervisorId)),
		);
	}),
	getStudents: teacherProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-teacher-get-students-query",
			db
				.select()
				.from(schema.student)
				.where(eq(schema.student.mentorId, context.user.id)),
			[],
		);
	}),
	getSlots: teacherProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-teacher-get-slots-query",
			db
				.select()
				.from(schema.slot)
				.where(eq(schema.slot.teacherId, context.user.id)),
			[],
		);
	}),
	updateAvailability: teacherProcedure
		.input(availabilityZod)
		.handler(async ({ context, input }) => {
			return await tryAPI(
				"db-teacher-updates-availability",
				db
					.update(schema.teacher)
					.set({
						availability: input,
					})
					.where(eq(schema.teacher.id, context.user.id))
					.returning(),
			);
		}),
	updateLeaves: teacherProcedure
		.input(
			z
				.object({
					dateLeaves: z.array(dateLeave),
					timeLeaves: z.array(timeLeave),
				})
				.partial(),
		)
		.handler(async ({ context, input }) => {
			return await tryAPI(
				"db-teacher-update-leaves",
				db
					.update(schema.teacher)
					.set(input)
					.where(eq(schema.teacher.id, context.user.id))
					.returning(),
			);
		}),
};
