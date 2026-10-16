import { count, eq } from "drizzle-orm";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import {
	InsertProgramSchema,
	SelectProgramSchema,
	UpdateProgramSchema,
} from "@/db/zod";
import { db } from "@/services";
import { MapRole } from "@/utils/role";

/**
 * Order lessons using the program's `lessons` array ("lessons to watch").
 * Lessons missing from the array keep their relative position at the end.
 */
export const orderLessons = <T extends { id: string }>(
	lessons: T[],
	order: string[],
) => {
	const position = new Map(order.map((id, index) => [id, index]));
	return [...lessons].sort(
		(a, b) =>
			(position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
			(position.get(b.id) ?? Number.MAX_SAFE_INTEGER),
	);
};

export const programRouter = {
	list: getRolesProcedure(["admin", "scheduler", "teacher"]).handler(
		async () => {
			const programs = await getAPI(
				"db-core-list-programs",
				db.query.program.findMany({
					orderBy: { name: "asc" },
				}),
				[],
			);

			const counts = await getAPI(
				"db-core-list-program-lesson-counts",
				db
					.select({
						program: schema.lesson.program,
						count: count(),
					})
					.from(schema.lesson)
					.groupBy(schema.lesson.program),
				[],
			);

			const countByProgram = new Map(
				counts.map((row) => [row.program, row.count]),
			);

			return programs.map((program) => ({
				...program,
				lessonCount: countByProgram.get(program.id) ?? 0,
			}));
		},
	),
	get: getRolesProcedure(["admin", "scheduler", "teacher"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const program = await tryAPI(
				"db-core-get-program",
				db.query.program.findFirst({
					where: {
						id: input.id,
					},
				}),
			);

			if (!program) throw getError("NOT_FOUND", "Program not found");

			const [lessonTotals] = await getAPI(
				"db-core-get-program-lesson-count",
				db
					.select({ count: count() })
					.from(schema.lesson)
					.where(eq(schema.lesson.program, input.id)),
				[{ count: 0 }],
			);

			return { ...program, lessonCount: lessonTotals?.count ?? 0 };
		}),
	create: getRolesProcedure(["admin"])
		.input(
			InsertProgramSchema.omit({
				id: true,
				createdAt: true,
				updatedAt: true,
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-create-program",
				db
					.insert(schema.program)
					.values({ ...input, id: crypto.randomUUID() })
					.returning(),
			);
		}),
	update: getRolesProcedure(["admin"])
		.input(
			UpdateProgramSchema.required({
				id: true,
			}),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-update-program",
				db
					.update(schema.program)
					.set(input)
					.where(eq(schema.program.id, input.id))
					.returning(),
			);
		}),
	delete: getRolesProcedure(["admin"])
		.input(SelectProgramSchema.pick({ id: true }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-delete-program",
				db.delete(schema.program).where(eq(schema.program.id, input.id)),
			);
		}),
	students: getRolesProcedure(["admin", "scheduler", "teacher"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await getAPI(
				"db-core-get-program-students",
				db.query.student.findMany({
					where: MapRole(context.role, {
						admin: {
							program: input.id,
						},
						scheduler: {
							program: input.id,
							supervisorId: context.user.id,
						},
						teacher: {
							program: input.id,
							mentorId: context.user.id,
						},
					}),
					orderBy: { createdAt: "desc" },
					with: {
						user: true,
					},
				}),
				[],
			);
		}),
	lessons: getRolesProcedure(["admin", "scheduler", "teacher"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const program = await tryAPI(
				"db-core-get-program",
				db.query.program.findFirst({
					where: {
						id: input.id,
					},
				}),
			);

			const lessons = await getAPI(
				"db-core-get-program-lessons",
				db.query.lesson.findMany({
					where: {
						program: input.id,
					},
					orderBy: { createdAt: "desc" },
				}),
				[],
			);

			return orderLessons(lessons, program?.lessons ?? []);
		}),
	updateLessons: getRolesProcedure(["admin", "scheduler"])
		.input(SelectProgramSchema.pick({ id: true, lessons: true }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-update-program-lessons",
				db
					.update(schema.program)
					.set({ lessons: input.lessons })
					.where(eq(schema.program.id, input.id))
					.returning(),
			);
		}),
};
