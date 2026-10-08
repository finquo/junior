import { and, eq } from "drizzle-orm";
import z from "zod";
import { getAPI, getRolesProcedure, tryAPI } from "@/api/procedure";
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
				schedulerId: true,
				createdAt: true,
				updatedAt: true,
				endTime: true,
			})
				.extend({
					schedulerId: z.string().optional(),
				})
				.refine((data) => data.startTime < data.expectedEndTime, {
					message: "startTime must be before expectedEndTime",
				}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-create-slot",
				db
					.insert(schema.slot)
					.values({
						...input,
						schedulerId:
							context.role === "admin"
								? (input.schedulerId ?? context.user.id)
								: context.user.id,
					})
					.returning(),
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
};
