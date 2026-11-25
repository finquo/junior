import { count, eq, inArray } from "drizzle-orm";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import {
	InsertCourseSchema,
	SelectCourseSchema,
	UpdateCourseSchema,
} from "@/db/zod";
import { db } from "@/services";

export const courseRouter = {
	list: getRolesProcedure([
		"admin",
		"scheduler",
		"teacher",
		"enrollment_advisor",
		"qa_auditor",
		"financier",
	]).handler(async () => {
		const courses = await getAPI(
			"db-core-list-courses",
			db.query.course.findMany({ orderBy: { name: "asc" } }),
			[],
		);

		const courseIds = courses.map((course) => course.id);
		if (courseIds.length === 0) return [];

		const modules = await getAPI(
			"db-core-list-course-modules",
			db.query.module.findMany({
				where: { course: { in: courseIds } },
			}),
			[],
		);

		const moduleCountByCourse = new Map<string, number>();
		const moduleIds = modules.map((module) => module.id);
		for (const module of modules) {
			if (!module.course) continue;
			moduleCountByCourse.set(
				module.course,
				(moduleCountByCourse.get(module.course) ?? 0) + 1,
			);
		}

		const videoCountByCourse = new Map<string, number>();
		if (moduleIds.length > 0) {
			const rows = await getAPI(
				"db-core-list-course-video-counts",
				db
					.select({ module: schema.video.module, count: count() })
					.from(schema.video)
					.where(inArray(schema.video.module, moduleIds))
					.groupBy(schema.video.module),
				[],
			);
			const videoCountByModule = new Map(
				rows.map((row) => [row.module, row.count]),
			);
			for (const module of modules) {
				if (!module.course) continue;
				videoCountByCourse.set(
					module.course,
					(videoCountByCourse.get(module.course) ?? 0) +
						(videoCountByModule.get(module.id) ?? 0),
				);
			}
		}

		return courses.map((course) => ({
			...course,
			moduleCount: moduleCountByCourse.get(course.id) ?? 0,
			videoCount: videoCountByCourse.get(course.id) ?? 0,
		}));
	}),
	get: getRolesProcedure([
		"admin",
		"scheduler",
		"teacher",
		"enrollment_advisor",
		"qa_auditor",
		"financier",
	])
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const course = await tryAPI(
				"db-core-get-course",
				db.query.course.findFirst({ where: { id: input.id } }),
			);
			if (!course) throw getError("NOT_FOUND", "Course not found");

			const [moduleTotal] = await getAPI(
				"db-core-get-course-module-count",
				db
					.select({ count: count() })
					.from(schema.module)
					.where(eq(schema.module.course, input.id)),
				[{ count: 0 }],
			);
			const [videoTotal] = await getAPI(
				"db-core-get-course-video-count",
				db
					.select({ count: count() })
					.from(schema.video)
					.where(eq(schema.video.course, input.id)),
				[{ count: 0 }],
			);

			return {
				...course,
				moduleCount: moduleTotal?.count ?? 0,
				videoCount: videoTotal?.count ?? 0,
			};
		}),
	create: getRolesProcedure(["admin"])
		.input(
			InsertCourseSchema.omit({
				id: true,
				createdAt: true,
				updatedAt: true,
				modules: true,
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-create-course",
				db
					.insert(schema.course)
					.values({ ...input, id: crypto.randomUUID() })
					.returning(),
			);
		}),
	update: getRolesProcedure(["admin"])
		.input(UpdateCourseSchema.required({ id: true }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-update-course",
				db
					.update(schema.course)
					.set(input)
					.where(eq(schema.course.id, input.id))
					.returning(),
			);
		}),
	delete: getRolesProcedure(["admin"])
		.input(SelectCourseSchema.pick({ id: true }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-delete-course",
				db.delete(schema.course).where(eq(schema.course.id, input.id)),
			);
		}),
};
