import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { UpdateStudentSchema } from "@/db/zod";
import { db } from "@/services";
import { getAPI, studentProcedure, tryAPI } from "../procedure";

export const studentRouter = {
	get: studentProcedure.handler(async ({ context }) => {
		return await tryAPI(
			"db-get-student-query",
			db
				.select()
				.from(schema.student)
				.where(eq(schema.student.id, context.user.id)),
		);
	}),
	getMentor: studentProcedure.handler(async ({ context }) => {
		const mentorId = db
			.select({
				mentorId: schema.student.mentorId,
			})
			.from(schema.student)
			.where(eq(schema.student.id, context.user.id));

		return await tryAPI(
			"db-student-get-mentor-query",
			db
				.select()
				.from(schema.scheduler)
				.where(eq(schema.scheduler.id, mentorId)),
		);
	}),
	getSupervisor: studentProcedure.handler(async ({ context }) => {
		const supervisorId = db
			.select({
				supervisorId: schema.student.supervisorId,
			})
			.from(schema.student)
			.where(eq(schema.student.id, context.user.id));

		return await tryAPI(
			"db-teacher-get-supervisor-query",
			db
				.select()
				.from(schema.scheduler)
				.where(eq(schema.scheduler.id, supervisorId)),
		);
	}),
	getSlots: studentProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-student-get-slots-query",
			db
				.select()
				.from(schema.slot)
				.where(eq(schema.slot.studentId, context.user.id)),
			[],
		);
	}),
	update: studentProcedure
		.input(
			UpdateStudentSchema.omit({
				id: true,
				mentorId: true,
				supervisorId: true,
				notes: true,
				lessons: true,
				meetingLink: true,
				paid: true,
				amount: true,
				remaining: true,
				createdAt: true,
				updatedAt: true,
			}),
		)
		.handler(async ({ context, input }) => {
			return await tryAPI(
				"db-student-update",
				db
					.update(schema.student)
					.set(input)
					.where(eq(schema.student.id, context.user.id))
					.returning(),
			);
		}),
};
