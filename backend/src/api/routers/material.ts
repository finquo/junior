import { eq } from "drizzle-orm";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import {
	InsertMaterialSchema,
	SelectMaterialSchema,
	UpdateMaterialSchema,
} from "@/db/zod";
import { db } from "@/services";

const materialWith = {
	student: { with: { user: true } },
	scheduler: { with: { user: true } },
} as const;

export const materialRouter = {
	list: getRolesProcedure(["admin", "scheduler"]).handler(() =>
		getAPI(
			"db-core-list-materials-query",
			db.query.material.findMany({
				orderBy: { createdAt: "desc" },
				with: materialWith,
			}),
			[],
		),
	),
	get: getRolesProcedure(["admin", "scheduler"])
		.input(SelectMaterialSchema.pick({ id: true }))
		.handler(async ({ input }) => {
			const material = await tryAPI(
				"db-core-get-material",
				db.query.material.findFirst({
					where: { id: input.id },
					with: materialWith,
				}),
			);

			if (!material) return null;

			const lessonList = await getAPI(
				"db-core-get-material-lessons-query",
				db.query.lesson.findMany({
					where: { id: { in: material.lessons } },
					with: { programInfo: true },
				}),
				[],
			);

			return { ...material, lessonList };
		}),
	create: getRolesProcedure(["admin", "scheduler"])
		.input(
			InsertMaterialSchema.omit({
				id: true,
				createdAt: true,
				updatedAt: true,
			}),
		)
		.handler(async ({ input, context }) => {
			const schedulerId =
				context.role === "admin" ? input.schedulerId : context.user.id;

			return await tryAPI(
				"db-core-create-material",
				db
					.insert(schema.material)
					.values({ ...input, schedulerId })
					.returning(),
			);
		}),
	update: getRolesProcedure(["admin", "scheduler"])
		.input(UpdateMaterialSchema.required({ id: true }))
		.handler(async ({ input, context }) => {
			if (input.schedulerId !== undefined && context.role !== "admin")
				throw getError("FORBIDDEN", "Only admins can change the scheduler");

			return await tryAPI(
				"db-core-update-material",
				db
					.update(schema.material)
					.set(input)
					.where(eq(schema.material.id, input.id))
					.returning(),
			);
		}),
};
