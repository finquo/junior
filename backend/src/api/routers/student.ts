import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { UpdateStudentSchema } from "@/db/zod";
import { db } from "@/services";
import { getAPI, studentProcedure, tryAPI } from "../procedure";
import { orderLessons } from "./core/program";

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
			db.select().from(schema.teacher).where(eq(schema.teacher.id, mentorId)),
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
	getProgram: studentProcedure.handler(async ({ context }) => {
		if (!context?.data?.program) return null;

		return await tryAPI(
			"db-student-get-program-query",
			db.query.program.findFirst({
				where: { id: context.data.program },
				columns: {
					name: true,
					description: true,
				},
			}),
		);
	}),
	getLessons: studentProcedure.handler(async ({ context }) => {
		if (!context?.data?.program) return [];

		const program = await tryAPI(
			"db-student-get-lessons-order-query",
			db.query.program.findFirst({
				where: { id: context.data.program },
				columns: { lessons: true },
				with: {
					lessonList: true,
				},
			}),
		);

		const attended = new Set(context?.data?.attendedLessons ?? []);

		return orderLessons(program?.lessonList ?? [], program?.lessons ?? []).map(
			(lesson, index) => ({
				...lesson,
				position: index + 1,
				attended: attended.has(lesson.id),
			}),
		);
	}),
	update: studentProcedure
		.input(
			UpdateStudentSchema.omit({
				id: true,
				mentorId: true,
				supervisorId: true,
				notes: true,
				attendedLessons: true,
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
