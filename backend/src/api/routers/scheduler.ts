import { and, desc, eq, sql } from "drizzle-orm";
import { SwitchFunc } from "utils";
import z from "zod";
import { getDaykey, periodZod } from "@/config/time";
import { schema } from "@/db";
import {
	InsertLessonSchema,
	InsertSlotSchema,
	SelectSlotSchema,
	SelectStudentSchema,
	SelectUserSchema,
	UpdateSlotSchema,
} from "@/db/zod";
import { db } from "@/services";
import { checkAgainstLeaves } from "@/utils/leave";
import { getAPI, getError, schedulerProcedure, tryAPI } from "../procedure";

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
			db.query.teacher.findMany({
				where: {
					supervisorId: context.user.id,
				},
				orderBy: { createdAt: "desc" },
				with: {
					user: true,
				},
			}),
			[],
		);
	}),
	checkTeacherAvailability: schedulerProcedure
		.input(
			z.object({
				id: z.string(),
				date: z.coerce.date().transform((d) => {
					const targetDate = new Date(d);
					const dayKey = getDaykey(targetDate.getDay());
					const dayStart = new Date(targetDate).setHours(0, 0, 0, 0);
					const dayEnd = new Date(targetDate).setHours(23, 59, 59, 999);

					return {
						dayKey,
						targetDate,
						dayStart,
						dayEnd,
					};
				}),
				period: periodZod,
			}),
		)
		.handler(async ({ input, context }) => {
			const { targetDate, dayStart, dayEnd, dayKey } = input.date;

			const teacherRecord = await tryAPI(
				"db-scheduler-check-teacher",
				db.query.teacher.findFirst({
					where: {
						id: input.id,
						supervisorId: context.user.id,
					},
				}),
			);

			if (!teacherRecord) throw getError("NOT_FOUND", "Teacher not found");

			if (!teacherRecord.availability)
				throw getError(
					"NOT_IMPLEMENTED",
					"Teacher did not updated their availability",
				);

			const dayConfig = teacherRecord.availability[dayKey];

			if (!dayConfig?.enabled || !dayConfig.ranges?.length) {
				return {
					isAvailable: false,
					reason: "Teacher is not available on this day",
				};
			}

			const { isLeave, type, time } = checkAgainstLeaves(
				targetDate,
				teacherRecord.leaves,
			);

			if (isLeave)
				return {
					isAvailable: false,
					time,
					reason: SwitchFunc(type, {
						partial: "Teacher took a partial leave on this date & time",
						full: "Teacher took a full leave on this date",
						multiple: "Teacher took multiple leaves, including this date",
					}),
				};

			// const existingSlots = await tryAPI(
			// 	"db-scheduler-check-active-booked-slots",
			// 	db
			// 		.select({
			// 			startTime: schema.slot.startTime,
			// 			expectedEndTime: schema.slot.expectedEndTime,
			// 		})
			// 		.from(schema.slot)
			// 		.where(
			// 			and(
			// 				eq(schema.slot.teacherId, input.id),
			// 				inArray(schema.slot.status, [
			// 					"scheduled",
			// 					"rescheduled",
			// 					"started",
			// 				]),
			// 				lt(schema.slot.startTime, dayEnd),
			// 				gt(schema.slot.expectedEndTime, dayStart),
			// 			),
			// 		),
			// );

			return {
				isAvailable: true,
				availableSlots: [],
			};
		}),
	getStudents: schedulerProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-scheduler-get-students-query",
			db
				.select()
				.from(schema.student)
				.where(eq(schema.student.supervisorId, context.user.id))
				.orderBy(desc(schema.student.createdAt)),
			[],
		);
	}),
	getSlots: schedulerProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-scheduler-get-slots-query",
			db
				.select()
				.from(schema.slot)
				.where(eq(schema.slot.schedulerId, context.user.id))
				.orderBy(desc(schema.slot.createdAt)),
			[],
		);
	}),
	searchTeachers: schedulerProcedure
		.input(
			SelectUserSchema.pick({ name: true }).extend({
				searchQuery: SelectUserSchema.shape.name
					.min(3, { message: "Type at least 3 letters" })
					.optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const query = input.searchQuery || input.name;
			return await getAPI(
				"db-scheduler-search-teachers-query",
				db
					.select()
					.from(schema.teacher)
					.innerJoin(schema.user, eq(schema.teacher.id, schema.user.id))
					.where(
						and(
							eq(schema.teacher.supervisorId, context.user.id),
							query ? sql`${schema.user.name} % ${query}` : undefined,
						),
					)
					.orderBy(
						query
							? sql`similarity(${schema.user.name}, ${query}) DESC`
							: desc(schema.teacher.createdAt),
					),
				[],
			);
		}),
	searchStudents: schedulerProcedure
		.input(
			SelectUserSchema.pick({ name: true }).extend({
				searchQuery: SelectUserSchema.shape.name
					.min(3, { message: "Type at least 3 letters" })
					.optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			const query = input.searchQuery || input.name;
			return await getAPI(
				"db-scheduler-search-students-query",
				db
					.select()
					.from(schema.student)
					.innerJoin(schema.user, eq(schema.student.id, schema.user.id))
					.where(
						and(
							eq(schema.student.supervisorId, context.user.id),
							query ? sql`${schema.user.name} % ${query}` : undefined,
						),
					)
					.orderBy(
						query
							? sql`similarity(${schema.user.name}, ${query}) DESC`
							: desc(schema.student.createdAt),
					),
				[],
			);
		}),
	createSlot: schedulerProcedure
		.input(
			InsertSlotSchema.omit({
				id: true,
				schedulerId: true,
				createdAt: true,
				updatedAt: true,
				endTime: true,
			}).refine((data) => data.startTime < data.expectedEndTime, {
				message: "startTime must be before expectedEndTime",
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-scheduler-create-slot",
				db
					.insert(schema.slot)
					.values({
						...input,
						schedulerId: context.user.id,
					})
					.returning(),
			);
		}),
	rescheduleSlot: schedulerProcedure
		.input(
			UpdateSlotSchema.omit({
				schedulerId: true,
				createdAt: true,
				updatedAt: true,
				endTime: true,
			})
				.merge(
					SelectSlotSchema.pick({
						id: true,
						startTime: true,
						expectedEndTime: true,
					}),
				)
				.refine((data) => data.startTime < data.expectedEndTime, {
					message: "startTime must be before expectedEndTime",
				}),
		)
		.handler(async ({ input, context }) => {
			const { id, ...data } = input;
			return await tryAPI(
				"db-scheduler-reschedule-slot",
				db
					.update(schema.slot)
					.set(data)
					.where(
						and(
							eq(schema.slot.id, id),
							eq(schema.slot.schedulerId, context.user.id),
						),
					)
					.returning(),
			);
		}),
	createLesson: schedulerProcedure
		.input(
			InsertLessonSchema.omit({
				id: true,
				quiz: true,
				createdAt: true,
				updatedAt: true,
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-scheduler-create-lesson",
				db.insert(schema.lesson).values(input).returning(),
			);
		}),
	updateStudentLessons: schedulerProcedure
		.input(
			SelectStudentSchema.pick({
				id: true,
				lessons: true,
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-scheduler-update-student-lessons",
				db
					.update(schema.student)
					.set({
						lessons: input.lessons,
					})
					.where(
						and(
							eq(schema.student.id, input.id),
							eq(schema.student.supervisorId, context.user.id),
						),
					)
					.returning(),
			);
		}),
};
