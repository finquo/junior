import { and, eq, gt, inArray, lt, ne, sql } from "drizzle-orm";
import { SwitchFunc } from "utils";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { notifySlotCreated, notifySlotUpdated } from "@/chat/notify";
import { getAvailabilityForDay, getDaykey, periodZod } from "@/config/time";
import { schema } from "@/db";
import { InsertSlotSchema, UpdateSlotSchema } from "@/db/zod";
import { db } from "@/services";
import { MapRole } from "@/utils/role";
import {
	getDayBounds,
	getLeavesForDay,
	getSlotCheckStatus,
	getUnavailableIntervals,
} from "@/utils/slot";

const DEMO_ID = "demo";

export const slotRouter = {
	list: getRolesProcedure([
		"admin",
		"scheduler",
		"teacher",
		"qa_auditor",
		"financier",
	]).handler(async ({ context }) => {
		return await getAPI(
			"db-core-get-slots-query",
			db.query.slot.findMany({
				where: MapRole(context.role, {
					admin: {},
					qa_auditor: {},
					financier: {},
					scheduler: {
						schedulerId: context.user.id,
					},
					teacher: {
						teacherId: context.user.id,
					},
				}),
				orderBy: {
					startTime: "desc",
				},
				with: {
					teacher: { with: { user: true } },
					student: { with: { user: true } },
					lesson: true,
				},
			}),
			[],
		);
	}),
	get: getRolesProcedure([
		"admin",
		"scheduler",
		"teacher",
		"student",
		"qa_auditor",
		"financier",
	])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			// Demo sandbox slot. Remove this branch before deploying.
			if (input.id === DEMO_ID) {
				const now = new Date();
				const endTime = new Date(now.getTime() + 45 * 60_000);

				return {
					id: DEMO_ID,
					meetingLink: null,
					studentId: null,
					teacherId: null,
					schedulerId: null,
					lessonId: DEMO_ID,
					startTime: now,
					expectedEndTime: endTime,
					endTime: null,
					status: "started",
					createdAt: now,
					updatedAt: now,
				} as const;
			}

			return await tryAPI(
				"db-core-get-slot",
				db.query.slot.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.id,
						},
						qa_auditor: {
							id: input.id,
						},
						financier: {
							id: input.id,
						},
						scheduler: {
							id: input.id,
							schedulerId: context.user.id,
						},
						teacher: {
							id: input.id,
							teacherId: context.user.id,
						},
						student: {
							id: input.id,
							studentId: context.user.id,
						},
					}),
				}),
			);
		}),
	create: getRolesProcedure(["admin", "scheduler"])
		.input(
			InsertSlotSchema.omit({
				id: true,
				createdAt: true,
				updatedAt: true,
				endTime: true,
				expectedEndTime: true,
			})
				.extend({
					period: periodZod,
				})
				.transform((d) => ({
					...d,
					expectedEndTime: new Date(d.startTime.getTime() + d.period),
				})),
		)
		.handler(async ({ input, context }) => {
			const created = await tryAPI(
				"db-core-create-slot",
				db.insert(schema.slot).values(input).returning(),
			);

			const slot = created?.[0];
			if (!slot) return created;

			try {
				const lesson = await tryAPI(
					"db-core-create-slot-lesson",
					db.query.lesson.findFirst({
						where: { id: slot.lessonId },
						columns: { name: true },
					}),
				);
				const users = await getAPI(
					"db-core-create-slot-users",
					db
						.select({
							id: schema.user.id,
							name: schema.user.name,
							phoneNumber: schema.user.phoneNumber,
						})
						.from(schema.user)
						.where(
							inArray(
								schema.user.id,
								[slot.studentId, slot.teacherId, slot.schedulerId].filter(
									(id): id is string => Boolean(id),
								),
							),
						),
					[],
				);
				const userById = new Map(users.map((user) => [user.id, user]));

				await notifySlotCreated({
					startTime: slot.startTime,
					lessonName: lesson?.name ?? "a class",
					joinLink: `${new URL(context.req.url).origin}/call/${slot.id}`,
					student: userById.get(slot.studentId ?? ""),
					teacher: userById.get(slot.teacherId ?? ""),
					scheduler: userById.get(slot.schedulerId ?? ""),
				});
			} catch (error) {
				console.error("[core-create-slot-notify]", error);
			}

			return created;
		}),
	update: getRolesProcedure(["admin", "scheduler"])
		.input(
			UpdateSlotSchema.omit({
				createdAt: true,
				updatedAt: true,
				endTime: true,
				studentId: true,
				startTime: true,
				expectedEndTime: true,
			}).required({
				id: true,
			}),
		)
		.handler(async ({ input, context }) => {
			const { id, ...data } = input;

			if (data.schedulerId !== undefined && context.role !== "admin")
				throw getError("FORBIDDEN", "Only admins can change the scheduler");

			const existing = await tryAPI(
				"db-core-update-slot-find",
				db.query.slot.findFirst({
					where: { id },
					columns: {
						startTime: true,
						teacherId: true,
						lessonId: true,
						schedulerId: true,
					},
				}),
			);

			const participantChanged = Boolean(
				existing &&
					((data.teacherId !== undefined &&
						data.teacherId !== existing.teacherId) ||
						(data.lessonId !== undefined &&
							data.lessonId !== existing.lessonId) ||
						(data.schedulerId !== undefined &&
							data.schedulerId !== existing.schedulerId)),
			);

			const updated = await tryAPI(
				"db-core-update-slot",
				db
					.update(schema.slot)
					.set(data)
					.where(
						MapRole(context.role, {
							admin: eq(schema.slot.id, id),
							scheduler: and(
								eq(schema.slot.id, id),
								eq(schema.slot.schedulerId, context.user.id),
							),
						}),
					)
					.returning(),
			);

			const slot = updated?.[0];

			if (slot?.status === "attended" && slot.studentId) {
				await tryAPI(
					"db-core-update-slot-mark-attended-student",
					db
						.update(schema.student)
						.set({
							attendedLessons: sql`ARRAY(SELECT DISTINCT unnest(${schema.student.attendedLessons} || ARRAY[${slot.lessonId}]::text[]))`,
						})
						.where(eq(schema.student.id, slot.studentId)),
				);
			}

			if (!slot || !participantChanged) return updated;

			/*
			try {
				const lesson = await tryAPI(
					"db-core-update-slot-lesson",
					db.query.lesson.findFirst({
						where: { id: slot.lessonId },
						columns: { name: true },
					}),
				);
				const users = await getAPI(
					"db-core-update-slot-users",
					db
						.select({
							id: schema.user.id,
							name: schema.user.name,
							phoneNumber: schema.user.phoneNumber,
						})
						.from(schema.user)
						.where(
							inArray(
								schema.user.id,
								[slot.studentId, slot.teacherId, slot.schedulerId].filter(
									(id): id is string => Boolean(id),
								),
							),
						),
					[],
				);
				const userById = new Map(users.map((user) => [user.id, user]));

				await notifySlotUpdated({
					startTime: slot.startTime,
					lessonName: lesson?.name ?? "a class",
					joinLink: `${new URL(context.req.url).origin}/call/${id}`,
					student: userById.get(slot.studentId ?? ""),
					teacher: userById.get(slot.teacherId ?? ""),
					scheduler: userById.get(slot.schedulerId ?? ""),
				});
			} catch (error) {
				console.error("[core-update-slot-notify]", error);
			}
			*/

			return updated;
		}),
	reschedule: getRolesProcedure(["admin", "scheduler"])
		.input(
			UpdateSlotSchema.pick({
				id: true,
				startTime: true,
				expectedEndTime: true,
			})
				.required({
					id: true,
					startTime: true,
					expectedEndTime: true,
				})
				.refine((data) => data.startTime < data.expectedEndTime, {
					message: "startTime must be before expectedEndTime",
				}),
		)
		.handler(async ({ input, context }) => {
			const { id, ...data } = input;

			const updated = await tryAPI(
				"db-core-reschedule-slot",
				db
					.update(schema.slot)
					.set({
						...data,
						status: "rescheduled",
						endTime: null,
						sessionId: null,
					})
					.where(
						MapRole(context.role, {
							admin: eq(schema.slot.id, id),
							scheduler: and(
								eq(schema.slot.id, id),
								eq(schema.slot.schedulerId, context.user.id),
							),
						}),
					)
					.returning(),
			);

			const slot = updated?.[0];
			if (!slot) return updated;

			/*
			try {
				const lesson = await tryAPI(
					"db-core-reschedule-slot-lesson",
					db.query.lesson.findFirst({
						where: { id: slot.lessonId },
						columns: { name: true },
					}),
				);
				const users = await getAPI(
					"db-core-reschedule-slot-users",
					db
						.select({
							id: schema.user.id,
							name: schema.user.name,
							phoneNumber: schema.user.phoneNumber,
						})
						.from(schema.user)
						.where(
							inArray(
								schema.user.id,
								[slot.studentId, slot.teacherId, slot.schedulerId].filter(
									(id): id is string => Boolean(id),
								),
							),
						),
					[],
				);
				const userById = new Map(users.map((user) => [user.id, user]));

				await notifySlotUpdated({
					startTime: slot.startTime,
					lessonName: lesson?.name ?? "a class",
					joinLink: `${new URL(context.req.url).origin}/call/${id}`,
					student: userById.get(slot.studentId ?? ""),
					teacher: userById.get(slot.teacherId ?? ""),
					scheduler: userById.get(slot.schedulerId ?? ""),
				});
			} catch (error) {
				console.error("[core-reschedule-slot-notify]", error);
			}
			*/

			return updated;
		}),
	requestReschedule: getRolesProcedure(["teacher"])
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-request-reschedule-slot",
				db
					.update(schema.slot)
					.set({ status: "request_reschedule" })
					.where(
						and(
							eq(schema.slot.id, input.id),
							eq(schema.slot.teacherId, context.user.id),
						),
					)
					.returning(),
			);
		}),
	delete: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-delete-slot",
				db
					.delete(schema.slot)
					.where(
						MapRole(context.role, {
							admin: eq(schema.slot.id, input.id),
							scheduler: and(
								eq(schema.slot.id, input.id),
								eq(schema.slot.schedulerId, context.user.id),
							),
						}),
					)
					.returning(),
			);
		}),
	checkAvailability: getRolesProcedure(["admin", "scheduler"])
		.input(
			z
				.object({
					teacherId: z.string(),
					excludeSlotId: z.string().optional(),
					date: z.date(),
					period: periodZod,
				})
				.transform((d) => ({
					...d,
					endTime: new Date(d.date.getTime() + d.period),
				})),
		)
		.handler(async ({ input, context }) => {
			const existingSlots = await tryAPI(
				"db-core-check-active-booked-slots",
				db
					.select({
						startTime: schema.slot.startTime,
						expectedEndTime: schema.slot.expectedEndTime,
					})
					.from(schema.slot)
					.where(
						and(
							eq(schema.slot.teacherId, input.teacherId),
							inArray(schema.slot.status, [
								"scheduled",
								"rescheduled",
								"started",
							]),
							lt(schema.slot.startTime, input.endTime),
							input.excludeSlotId
								? ne(schema.slot.id, input.excludeSlotId)
								: undefined,
							gt(schema.slot.expectedEndTime, input.date),
						),
					),
			);

			return {
				isAvailable: true,
				existingSlots,
				availableSlots: [],
			} as const;
		}),
	check: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				teacherId: z.string(),
				excludeSlotId: z.string().optional(),
				date: z.coerce.date().transform((d) => {
					const targetDate = new Date(d);
					const dayKey = getDaykey(targetDate.getDay());

					return {
						...getDayBounds(targetDate),
						dayKey,
					};
				}),
			}),
		)
		.handler(async ({ input, context }) => {
			const { dayKey, dayStart, dayEnd } = input.date;

			const teacherRecord = await tryAPI(
				"db-core-check-slot-teacher",
				db.query.teacher.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.teacherId,
						},
						scheduler: {
							id: input.teacherId,
							supervisorId: context.user.id,
						},
					}),
				}),
			);

			if (!teacherRecord) throw getError("NOT_FOUND", "Teacher not found");

			if (!teacherRecord.availability)
				throw getError(
					"NOT_IMPLEMENTED",
					"Teacher did not updated their availability",
				);

			const availability = getAvailabilityForDay(
				teacherRecord.availability,
				dayKey,
			);

			if (!availability.enabled || !availability.ranges.length) {
				throw getError(
					"PRECONDITION_FAILED",
					"Teacher did not updated their availability properly",
				);
			}

			const leaves = getLeavesForDay(
				teacherRecord.leaves ?? [],
				dayStart,
				dayEnd,
			);

			const status = getSlotCheckStatus({ availability, leaves });

			const bookedSlots = await getAPI(
				"db-core-check-slot-booked",
				db
					.select({
						id: schema.slot.id,
						startTime: schema.slot.startTime,
						expectedEndTime: schema.slot.expectedEndTime,
						status: schema.slot.status,
					})
					.from(schema.slot)
					.where(
						and(
							eq(schema.slot.teacherId, input.teacherId),
							inArray(schema.slot.status, [
								"scheduled",
								"rescheduled",
								"started",
							]),
							lt(schema.slot.startTime, dayEnd),
							input.excludeSlotId
								? ne(schema.slot.id, input.excludeSlotId)
								: undefined,
							gt(schema.slot.expectedEndTime, dayStart),
						),
					),
				[],
			);

			const unavailable = getUnavailableIntervals({
				availability,
				leaves,
				bookedSlots,
				dayStart,
			});

			return {
				dayKey,
				availability,
				leaves,
				bookedSlots,
				unavailable,
				status,
				message: SwitchFunc(status, {
					"available-undefined": "Teacher did not updated their availability",
					available: "Teacher is available for the selected day",
					unavailable: "Teacher is not available on this date",
					leave: "Teacher is available, but took a full leave on this date",
					"partial-leave":
						"Teacher is available, but took a partial leave inbetween",
				}),
			};
		}),
};
