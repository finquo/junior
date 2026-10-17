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

export const slotRouter = {
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
	get: getRolesProcedure(["admin", "scheduler", "teacher"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
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
