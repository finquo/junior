import { and, eq } from "drizzle-orm";
import z from "zod";
import { getAPI, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import { leaveItemZod } from "@/db/column/leave-range";
import { ArrayAppend } from "@/db/utils";
import { SelectTeacherSchema, UpdateTeacherSchema } from "@/db/zod";
import { db } from "@/services";
import { MapRole } from "@/utils/role";

export const teacherRouter = {
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
				supervisorId: true,
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
	addLeave: getRolesProcedure(["admin", "scheduler"])
		.input(
			SelectTeacherSchema.pick({ id: true }).safeExtend({
				leave: leaveItemZod.transform((l) => {
					if (l.type === "full") return { ...l, end: l.start };
					return l;
				}),
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-teacher-add-leave",
				db
					.update(schema.teacher)
					.set({
						leaves: ArrayAppend(schema.teacher.leaves, input.leave),
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
