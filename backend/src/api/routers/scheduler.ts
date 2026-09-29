import { and, desc, eq, sql } from "drizzle-orm";
import { schema } from "@/db";
import {
	InsertSlotSchema,
	SelectSlotSchema,
	SelectUserSchema,
	UpdateSlotSchema,
} from "@/db/zod";
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
				.where(eq(schema.teacher.supervisorId, context.user.id))
				.orderBy(desc(schema.teacher.createdAt)),
			[],
		);
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
};
