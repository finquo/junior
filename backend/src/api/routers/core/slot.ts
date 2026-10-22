import { and, eq, gt, inArray, lt } from "drizzle-orm";
import { SwitchFunc } from "utils";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { getAvailabilityForDay, getDaykey, periodZod } from "@/config/time";
import { schema } from "@/db";
import { InsertSlotSchema, SelectSlotSchema, UpdateSlotSchema } from "@/db/zod";
import { db } from "@/services";
import { MapRole } from "@/utils/role";
import {
	getDayBounds,
	getLeavesForDay,
	getSlotCheckStatus,
	getUnavailableIntervals,
} from "@/utils/slot";
import { generateZoomToken } from "@/zoom/jwt";

const JOIN_WINDOW = 10 * 60 * 1000;

const DEMO_ID = "demo";
const DEMO_SESSION = "finquo-demo";

export const slotRouter = {
	join: getRolesProcedure(["admin", "scheduler", "teacher", "student"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const role = MapRole(context.role, {
				admin: 1,
				scheduler: 1,
				teacher: 1,
				student: 0,
			} as const);

			// Authenticated demo sandbox. Remove this branch before deploying.
			if (input.id === DEMO_ID) {
				const now = Date.now();
				return {
					status: "live",
					session: DEMO_SESSION,
					startTime: new Date(now),
					endTime: new Date(now + 2 * 60 * 60 * 1000),
					token: await generateZoomToken(DEMO_SESSION, role),
				} as const;
			}

			const slot = await tryAPI(
				"db-core-join-slot",
				db.query.slot.findFirst({
					where: { id: input.id },
					columns: {
						id: true,
						startTime: true,
						expectedEndTime: true,
						endTime: true,
						studentId: true,
						teacherId: true,
						schedulerId: true,
					},
				}),
			);

			if (!slot) return { status: "not_found" } as const;

			const authorized = MapRole(context.role, {
				admin: true,
				scheduler: slot.schedulerId === context.user.id,
				teacher: slot.teacherId === context.user.id,
				student: slot.studentId === context.user.id,
			});

			if (!authorized)
				throw getError(
					"FORBIDDEN",
					"You are not authorized to join this meeting",
				);

			const startTime = slot.startTime;
			const endTime = slot.endTime ?? slot.expectedEndTime;
			const now = Date.now();

			if (now < startTime.getTime() - JOIN_WINDOW)
				return { status: "upcoming", startTime, endTime } as const;

			if (now > endTime.getTime())
				return { status: "ended", startTime, endTime } as const;

			return {
				status: "live",
				session: slot.id,
				startTime,
				endTime,
				token: await generateZoomToken(slot.id, role),
			} as const;
		}),
	list: getRolesProcedure(["admin", "scheduler", "teacher"]).handler(
		async ({ context }) => {
			return await getAPI(
				"db-core-get-slots-query",
				db.query.slot.findMany({
					where: MapRole(context.role, {
						admin: {},
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
		},
	),
	get: getRolesProcedure(["admin", "scheduler", "teacher", "student"])
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
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-create-slot",
				db.insert(schema.slot).values(input).returning(),
			);
		}),
	update: getRolesProcedure(["admin", "scheduler"])
		.input(
			UpdateSlotSchema.omit({
				schedulerId: true,
				createdAt: true,
				updatedAt: true,
				endTime: true,
			})
				.required({
					id: true,
				})
				.refine(
					(data) => {
						if (data.startTime && data.expectedEndTime) {
							return data.startTime < data.expectedEndTime;
						}
						return true;
					},
					{
						message: "startTime must be before expectedEndTime",
					},
				),
		)
		.handler(async ({ input, context }) => {
			const { id, ...data } = input;

			return await tryAPI(
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
		}),
	reschedule: getRolesProcedure(["admin", "scheduler"])
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
				"db-core-reschedule-slot",
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
