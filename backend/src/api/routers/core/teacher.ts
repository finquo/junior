import { and, desc, eq, sql } from "drizzle-orm";
import { SwitchFunc } from "utils";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { getDaykey, periodZod } from "@/config/time";
import { schema } from "@/db";
import { AppendLeave, leaveItemZod } from "@/db/column/leave-range";
import {
	SelectTeacherSchema,
	SelectUserSchema,
	UpdateTeacherSchema,
} from "@/db/zod";
import { db } from "@/services";
import { checkAgainstLeaves } from "@/utils/leave";
import { MapRole } from "@/utils/role";

export const teacherRouter = {
	list: getRolesProcedure(["admin", "scheduler"]).handler(
		async ({ context }) => {
			return await getAPI(
				"db-core-get-teachers-query",
				db.query.teacher.findMany({
					where: MapRole(context.role, {
						admin: {},
						scheduler: {
							supervisorId: context.user.id,
						},
					}),
					orderBy: { createdAt: "desc" },
					with: {
						user: true,
					},
				}),
				[],
			);
		},
	),
	get: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-get-teacher",
				db.query.teacher.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.id,
						},
						scheduler: {
							id: input.id,
							supervisorId: context.user.id,
						},
					}),
					with: {
						user: true,
					},
				}),
			);
		}),
	search: getRolesProcedure(["admin", "scheduler"])
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
				"db-core-search-teachers-query",
				db
					.select()
					.from(schema.teacher)
					.innerJoin(schema.user, eq(schema.teacher.id, schema.user.id))
					.where(
						and(
							MapRole(context.role, {
								admin: undefined,
								scheduler: eq(schema.teacher.supervisorId, context.user.id),
							}),
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
	checkAvailability: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
				date: z.coerce.date().transform((d) => {
					const targetDate = new Date(d);
					const dayKey = getDaykey(targetDate.getDay());

					return {
						dayKey,
						targetDate,
					};
				}),
				period: periodZod,
			}),
		)
		.handler(async ({ input, context }) => {
			const { targetDate, dayKey } = input.date;

			const teacherRecord = await tryAPI(
				"db-core-check-teacher",
				db.query.teacher.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.id,
						},
						scheduler: {
							id: input.id,
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

			const dayConfig = teacherRecord.availability[dayKey];

			if (!dayConfig?.enabled || !dayConfig.ranges?.length) {
				return {
					isAvailable: false,
					reason: "Teacher is not available on this day",
				} as const;
			}

			const { isLeave, type, time } = checkAgainstLeaves(
				targetDate,
				teacherRecord.leaves ?? [],
				input.period,
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
				} as const;

			return {
				isAvailable: true,
				availableSlots: [],
			} as const;
		}),
	getSlots: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await getAPI(
				"db-core-get-teacher-slots",
				db
					.select()
					.from(schema.slot)
					.where(
						MapRole(context.role, {
							admin: eq(schema.slot.teacherId, input.id),
							scheduler: and(
								eq(schema.slot.teacherId, input.id),
								eq(schema.slot.schedulerId, context.user.id),
							),
						}),
					),
				[],
			);
		}),
	update: getRolesProcedure(["admin", "scheduler"])
		.input(
			UpdateTeacherSchema.omit({
				createdAt: true,
				updatedAt: true,
				leaves: true,
			}).required({
				id: true,
			}),
		)
		.handler(async ({ input, context }) => {
			const { id, ...data } = input;

			return await tryAPI(
				"db-core-update-teacher",
				db
					.update(schema.teacher)
					.set(data)
					.where(
						MapRole(context.role, {
							admin: eq(schema.teacher.id, id),
							scheduler: and(
								eq(schema.teacher.id, id),
								eq(schema.teacher.supervisorId, context.user.id),
							),
						}),
					)
					.returning(),
			);
		}),
	updateAvailability: getRolesProcedure(["admin", "scheduler"])
		.input(SelectTeacherSchema.pick({ id: true, availability: true }))
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-update-teacher-availability",
				db
					.update(schema.teacher)
					.set({
						availability: input.availability,
					})
					.where(
						MapRole(context.role, {
							admin: eq(schema.teacher.id, input.id),
							scheduler: and(
								eq(schema.teacher.id, input.id),
								eq(schema.teacher.supervisorId, context.user.id),
							),
						}),
					)
					.returning(),
			);
		}),
	updateLeaves: getRolesProcedure(["admin", "scheduler"])
		.input(
			SelectTeacherSchema.pick({ id: true }).safeExtend({
				leaves: leaveItemZod.array(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-teacher-add-leave",
				db
					.update(schema.teacher)
					.set({
						leaves: input.leaves,
					})
					.where(
						MapRole(context.role, {
							admin: eq(schema.teacher.id, input.id),
							scheduler: and(
								eq(schema.teacher.id, input.id),
								eq(schema.teacher.supervisorId, context.user.id),
							),
						}),
					)
					.returning(),
			);
		}),
	addLeave: getRolesProcedure(["admin", "scheduler"])
		.input(
			SelectTeacherSchema.pick({ id: true }).safeExtend({
				leave: leaveItemZod,
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-teacher-add-leave",
				db
					.update(schema.teacher)
					.set({
						leaves: AppendLeave(schema.teacher.leaves, input.leave),
					})
					.where(
						MapRole(context.role, {
							admin: eq(schema.teacher.id, input.id),
							scheduler: and(
								eq(schema.teacher.id, input.id),
								eq(schema.teacher.supervisorId, context.user.id),
							),
						}),
					)
					.returning(),
			);
		}),
};
