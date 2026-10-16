import { and, eq, gt, inArray, lt, or } from "drizzle-orm";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { getDaykey, periodZod } from "@/config/time";
import { schema } from "@/db";
import { InsertSlotSchema, SelectSlotSchema, UpdateSlotSchema } from "@/db/zod";
import { db } from "@/services";
import { MapRole } from "@/utils/role";

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
				date: z.coerce.date(),
			}),
		)
		.handler(async ({ input, context }) => {
			const targetDate = new Date(input.date);
			const dayKey = getDaykey(targetDate.getDay());

			const dayStart = new Date(targetDate);
			dayStart.setHours(0, 0, 0, 0);
			const dayEnd = new Date(dayStart);
			dayEnd.setDate(dayEnd.getDate() + 1);

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

			const availability = teacherRecord.availability?.[dayKey] ?? {
				enabled: false,
				ranges: [],
			};

			const leaves = (teacherRecord.leaves ?? [])
				.filter((leave) => leave.end > dayStart && leave.start < dayEnd)
				.map((leave) => ({
					type: leave.type,
					start: leave.start,
					end: leave.end,
				}));

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

			const timeToMinutes = (time: string) => {
				const [hours = 0, minutes = 0] = time.split(":").map(Number);
				return hours * 60 + minutes;
			};
			const minutesToTime = (minutes: number) => {
				const clamped = Math.max(0, Math.min(24 * 60, minutes));
				return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(
					clamped % 60,
				).padStart(2, "0")}`;
			};
			const dateToMinutes = (date: Date) =>
				Math.round((date.getTime() - dayStart.getTime()) / 60_000);

			const unavailable: {
				id: string;
				start: string;
				end: string;
				label: string;
				type: "outside_availability" | "leave" | "conflict";
			}[] = [];

			const ranges = [...(availability.ranges ?? [])]
				.map((range) => ({
					start: timeToMinutes(range.start),
					end: timeToMinutes(range.end),
				}))
				.sort((a, b) => a.start - b.start);

			const gaps: { start: number; end: number }[] = [];
			if (!availability.enabled || ranges.length === 0) {
				gaps.push({ start: 0, end: 24 * 60 });
			} else {
				let cursor = 0;
				for (const range of ranges) {
					if (range.start > cursor)
						gaps.push({ start: cursor, end: range.start });
					cursor = Math.max(cursor, range.end);
				}
				if (cursor < 24 * 60) gaps.push({ start: cursor, end: 24 * 60 });
			}

			gaps.forEach((gap, index) => {
				if (gap.end <= gap.start) return;
				unavailable.push({
					id: `availability-${index}`,
					start: minutesToTime(gap.start),
					end: minutesToTime(gap.end),
					label: "Outside teacher availability",
					type: "outside_availability",
				});
			});

			leaves.forEach((leave, index) => {
				const start = Math.max(0, dateToMinutes(leave.start));
				const end = Math.min(24 * 60, dateToMinutes(leave.end));
				if (end <= start) return;
				unavailable.push({
					id: `leave-${index}`,
					start: minutesToTime(start),
					end: minutesToTime(end),
					label:
						leave.type === "full"
							? "Teacher on leave"
							: "Teacher on partial leave",
					type: "leave",
				});
			});

			bookedSlots.forEach((slot) => {
				const start = Math.max(0, dateToMinutes(slot.startTime));
				const end = Math.min(24 * 60, dateToMinutes(slot.expectedEndTime));
				if (end <= start) return;
				unavailable.push({
					id: slot.id,
					start: minutesToTime(start),
					end: minutesToTime(end),
					label: "Booked slot",
					type: "conflict",
				});
			});

			return {
				teacherId: input.teacherId,
				date: targetDate,
				dayKey,
				availability,
				leaves,
				bookedSlots,
				unavailable,
			};
		}),
};
