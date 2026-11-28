import { count, eq, inArray } from "drizzle-orm";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import {
	InsertModuleSchema,
	SelectModuleSchema,
	UpdateModuleSchema,
} from "@/db/zod";
import { db } from "@/services";

const readRoles = [
	"admin",
	"scheduler",
	"teacher",
	"enrollment_advisor",
	"qa_auditor",
	"financier",
] as const;

const writeRoles = ["admin", "scheduler"] as const;

/**
 * Order modules using the parent course's `modules` array.
 * Modules missing from the array keep their relative position at the end.
 */
export function orderModules<T extends { id: string }>(
	modules: T[],
	order: string[],
) {
	const position = new Map(order.map((id, index) => [id, index]));
	return [...modules].sort(
		(a, b) =>
			(position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
			(position.get(b.id) ?? Number.MAX_SAFE_INTEGER),
	);
}

async function withVideoCount<T extends { id: string }>(
	modules: T[],
): Promise<(T & { videoCount: number })[]> {
	if (modules.length === 0) {
		return modules.map((module) => ({ ...module, videoCount: 0 }));
	}

	const counts = await getAPI(
		"db-core-list-module-video-counts",
		db
			.select({ module: schema.video.module, count: count() })
			.from(schema.video)
			.where(
				inArray(
					schema.video.module,
					modules.map((module) => module.id),
				),
			)
			.groupBy(schema.video.module),
		[],
	);
	const countByModule = new Map(counts.map((row) => [row.module, row.count]));

	return modules.map((module) => ({
		...module,
		videoCount: countByModule.get(module.id) ?? 0,
	}));
}

export const moduleRouter = {
	list: getRolesProcedure([...readRoles])
		.input(z.object({ course: z.string() }))
		.handler(async ({ input }) => {
			const course = await tryAPI(
				"db-core-list-course-modules-get-course",
				db.query.course.findFirst({ where: { id: input.course } }),
			);
			if (!course) throw getError("NOT_FOUND", "Course not found");

			const modules = await getAPI(
				"db-core-list-course-modules",
				db.query.module.findMany({ where: { course: input.course } }),
				[],
			);

			return await withVideoCount(orderModules(modules, course.modules ?? []));
		}),
	listAll: getRolesProcedure([...readRoles]).handler(async () => {
		const modules = await getAPI(
			"db-core-list-all-modules",
			db.query.module.findMany({
				orderBy: { name: "asc" },
				with: { courseInfo: true },
			}),
			[],
		);

		const withCounts = await withVideoCount(modules);
		return withCounts.map((module) => ({
			...module,
			courseName: module.courseInfo?.name ?? "Unknown course",
		}));
	}),
	get: getRolesProcedure([...readRoles])
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const module = await tryAPI(
				"db-core-get-module",
				db.query.module.findFirst({
					where: { id: input.id },
					with: { courseInfo: true },
				}),
			);
			if (!module) throw getError("NOT_FOUND", "Module not found");

			const [withCount] = await withVideoCount([module]);
			if (!withCount)
				throw getError(
					"INTERNAL_SERVER_ERROR",
					"Failed to count module videos",
				);

			return {
				...withCount,
				courseName: module.courseInfo?.name ?? "Unknown course",
			};
		}),
	create: getRolesProcedure([...writeRoles])
		.input(
			InsertModuleSchema.omit({
				id: true,
				createdAt: true,
				updatedAt: true,
				videos: true,
			}).required({ course: true }),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-create-module",
				db.transaction(async (tx) => {
					const course = await tx.query.course.findFirst({
						where: { id: input.course },
					});
					if (!course) throw getError("NOT_FOUND", "Course not found");

					const [created] = await tx
						.insert(schema.module)
						.values({ ...input, id: crypto.randomUUID() })
						.returning();
					if (!created)
						throw getError("INTERNAL_SERVER_ERROR", "Failed to create module");

					await tx
						.update(schema.course)
						.set({ modules: [...(course.modules ?? []), created.id] })
						.where(eq(schema.course.id, input.course));

					return created;
				}),
			);
		}),
	update: getRolesProcedure([...writeRoles])
		.input(UpdateModuleSchema.required({ id: true }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-update-module",
				db
					.update(schema.module)
					.set(input)
					.where(eq(schema.module.id, input.id))
					.returning(),
			);
		}),
	delete: getRolesProcedure([...writeRoles])
		.input(SelectModuleSchema.pick({ id: true }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-delete-module",
				db.transaction(async (tx) => {
					const module = await tx.query.module.findFirst({
						where: { id: input.id },
					});
					if (!module) throw getError("NOT_FOUND", "Module not found");

					await tx.delete(schema.module).where(eq(schema.module.id, input.id));

					if (module.course) {
						const course = await tx.query.course.findFirst({
							where: { id: module.course },
						});
						if (course) {
							await tx
								.update(schema.course)
								.set({
									modules: (course.modules ?? []).filter(
										(moduleId) => moduleId !== input.id,
									),
								})
								.where(eq(schema.course.id, module.course));
						}
					}

					return module;
				}),
			);
		}),
	reorder: getRolesProcedure([...writeRoles])
		.input(z.object({ course: z.string(), modules: z.string().array() }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-reorder-modules",
				db.transaction(async (tx) => {
					const course = await tx.query.course.findFirst({
						where: { id: input.course },
					});
					if (!course) throw getError("NOT_FOUND", "Course not found");

					const modules = await tx.query.module.findMany({
						where: { course: input.course },
					});
					const currentIds = new Set(modules.map((module) => module.id));
					const nextIds = new Set(input.modules);
					if (
						input.modules.length !== currentIds.size ||
						nextIds.size !== input.modules.length ||
						[...currentIds].some((id) => !nextIds.has(id))
					) {
						throw getError(
							"INPUT_VALIDATION_FAILED",
							"Module order must include every module exactly once",
						);
					}

					const [updated] = await tx
						.update(schema.course)
						.set({ modules: input.modules })
						.where(eq(schema.course.id, input.course))
						.returning();
					return updated;
				}),
			);
		}),
};
