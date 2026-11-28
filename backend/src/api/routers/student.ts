import { count, eq } from "drizzle-orm";
import { schema } from "@/db";
import { UpdateStudentSchema } from "@/db/zod";
import { db } from "@/services";
import { getAPI, studentProcedure, tryAPI } from "../procedure";
import { orderModules } from "./core/module";
import { orderLessons } from "./core/program";
import { orderVideos } from "./core/video";

export const studentRouter = {
	get: studentProcedure.handler(async ({ context }) => {
		return await tryAPI(
			"db-get-student-query",
			db
				.select()
				.from(schema.student)
				.where(eq(schema.student.id, context.user.id)),
		);
	}),
	getMentor: studentProcedure.handler(async ({ context }) => {
		const mentorId = db
			.select({
				mentorId: schema.student.mentorId,
			})
			.from(schema.student)
			.where(eq(schema.student.id, context.user.id));

		return await tryAPI(
			"db-student-get-mentor-query",
			db.select().from(schema.teacher).where(eq(schema.teacher.id, mentorId)),
		);
	}),
	getSupervisor: studentProcedure.handler(async ({ context }) => {
		const supervisorId = db
			.select({
				supervisorId: schema.student.supervisorId,
			})
			.from(schema.student)
			.where(eq(schema.student.id, context.user.id));

		return await tryAPI(
			"db-teacher-get-supervisor-query",
			db
				.select()
				.from(schema.scheduler)
				.where(eq(schema.scheduler.id, supervisorId)),
		);
	}),
	getSlots: studentProcedure.handler(async ({ context }) => {
		return await getAPI(
			"db-student-get-slots-query",
			db
				.select()
				.from(schema.slot)
				.where(eq(schema.slot.studentId, context.user.id)),
			[],
		);
	}),
	getProgram: studentProcedure.handler(async ({ context }) => {
		if (!context?.data?.program) return null;

		return await tryAPI(
			"db-student-get-program-query",
			db.query.program.findFirst({
				where: { id: context.data.program },
				columns: {
					name: true,
					description: true,
					materials: true,
				},
			}),
		);
	}),
	getLessons: studentProcedure.handler(async ({ context }) => {
		if (!context?.data?.program) return [];

		const program = await tryAPI(
			"db-student-get-lessons-order-query",
			db.query.program.findFirst({
				where: { id: context.data.program },
				columns: { lessons: true },
				with: {
					lessonList: true,
				},
			}),
		);

		const attended = new Set(context?.data?.attendedLessons ?? []);

		return orderLessons(program?.lessonList ?? [], program?.lessons ?? []).map(
			(lesson, index) => ({
				...lesson,
				position: index + 1,
				attended: attended.has(lesson.id),
			}),
		);
	}),
	getCourseMeta: studentProcedure.handler(async ({ context }) => {
		const courseId = context.data?.course;
		if (!courseId) return null;

		const [course, videoTotal] = await Promise.all([
			tryAPI(
				"db-student-get-course-meta-query",
				db.query.course.findFirst({
					where: { id: courseId },
					columns: {
						id: true,
						name: true,
						description: true,
						language: true,
						modules: true,
					},
				}),
			),
			getAPI(
				"db-student-get-course-video-count-query",
				db
					.select({ count: count() })
					.from(schema.video)
					.where(eq(schema.video.course, courseId)),
				[{ count: 0 }],
			),
		]);
		if (!course) return null;

		return {
			id: course.id,
			name: course.name,
			description: course.description,
			language: course.language,
			moduleCount: course.modules?.length ?? 0,
			videoCount: videoTotal[0]?.count ?? 0,
		};
	}),
	getCourseVideoGroups: studentProcedure.handler(async ({ context }) => {
		const courseId = context.data?.course;
		if (!courseId) return [];

		const [course, modules, videos] = await Promise.all([
			tryAPI(
				"db-student-get-course-video-groups-order-query",
				db.query.course.findFirst({
					where: { id: courseId },
					columns: { modules: true },
				}),
			),
			getAPI(
				"db-student-get-course-video-modules-query",
				db.query.module.findMany({ where: { course: courseId } }),
				[],
			),
			getAPI(
				"db-student-get-course-videos-query",
				db.query.video.findMany({ where: { course: courseId } }),
				[],
			),
		]);
		if (!course) return [];

		const attended = new Set(context.data?.attendedModules ?? []);
		const watched = new Set(context.data?.watchedVideos ?? []);
		const orderedModules = orderModules(modules, course.modules ?? []);
		const groups = orderedModules.map((module, index) => ({
			id: module.id,
			name: module.name,
			description: module.description,
			position: index + 1,
			status: attended.has(module.id)
				? ("attended" as const)
				: ("upcoming" as const),
			videos: [] as {
				id: string;
				name: string;
				description: string | null;
				position: number;
				status: "watched" | "unwatched";
			}[],
		}));
		const groupById = new Map(groups.map((group) => [group.id, group]));
		const order = orderedModules.flatMap((module) => module.videos ?? []);

		for (const video of orderVideos(videos, order)) {
			const group = groupById.get(video.module);
			if (!group) continue;

			group.videos.push({
				id: video.id,
				name: video.name,
				description: video.description,
				position: group.videos.length + 1,
				status: watched.has(video.id) ? "watched" : "unwatched",
			});
		}

		return groups;
	}),
	update: studentProcedure
		.input(
			UpdateStudentSchema.pick({
				address: true,
				currentAddress: true,
				age: true,
				country: true,
				grade: true,
				schooling: true,
			}),
		)
		.handler(async ({ context, input }) => {
			return await tryAPI(
				"db-student-update",
				db
					.update(schema.student)
					.set(input)
					.where(eq(schema.student.id, context.user.id))
					.returning(),
			);
		}),
};
