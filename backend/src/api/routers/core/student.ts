import { and, desc, eq, sql } from "drizzle-orm";
import { resolveDefaultAmount } from "utils";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import {
	SelectStudentSchema,
	SelectUserSchema,
	UpdateStudentSchema,
} from "@/db/zod";
import { db } from "@/services";
import { MapRole } from "@/utils/role";

export const studentRouter = {
	list: getRolesProcedure(["admin", "scheduler", "teacher"]).handler(
		async ({ context }) => {
			return await getAPI(
				"db-core-list-students-query",
				db.query.student.findMany({
					where: MapRole(context.role, {
						admin: {},
						scheduler: {
							supervisorId: context.user.id,
						},
						teacher: {
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
		},
	),
	get: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-get-student",
				db.query.student.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.id,
						},
						teacher: {
							id: input.id,
							mentorId: context.user.id,
						},
						scheduler: {
							id: input.id,
							supervisorId: context.user.id,
						},
					}),
					with: {
						user: true,
						programInfo: true,
					},
				}),
			);
		}),
	search: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				query: z.string().min(3, { message: "Type at least 3 letters" }),
			}),
		)
		.handler(async ({ input: { query }, context }) => {
			return await getAPI(
				"db-core-search-students-query",
				db
					.select()
					.from(schema.student)
					.innerJoin(schema.user, eq(schema.student.id, schema.user.id))
					.where(
						and(
							MapRole(context.role, {
								admin: undefined,
								scheduler: eq(schema.student.supervisorId, context.user.id),
								teacher: eq(schema.student.mentorId, context.user.id),
							}),
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
	getAttendedLessons: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const data = await tryAPI(
				"db-core-get-student-attended-lessons",
				db.query.student.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.id,
						},
						teacher: {
							id: input.id,
							mentorId: context.user.id,
						},
						scheduler: {
							id: input.id,
							supervisorId: context.user.id,
						},
					}),
					columns: {
						attendedLessons: true,
					},
				}),
			);

			return data?.attendedLessons ?? [];
		}),
	getCurriculum: getRolesProcedure(["admin", "teacher", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const student = await tryAPI(
				"db-core-get-student-curriculum",
				db.query.student.findFirst({
					where: MapRole(context.role, {
						admin: {
							id: input.id,
						},
						teacher: {
							id: input.id,
							mentorId: context.user.id,
						},
						scheduler: {
							id: input.id,
							supervisorId: context.user.id,
						},
					}),
					columns: {
						program: true,
						attendedLessons: true,
					},
				}),
			);

			const attendedLessons = student?.attendedLessons ?? [];

			if (!student?.program) {
				return { program: null, lessons: [], attendedLessons };
			}

			const program = await tryAPI(
				"db-core-get-student-program",
				db.query.program.findFirst({
					where: { id: student.program },
				}),
			);

			const lessons = await getAPI(
				"db-core-get-student-program-lessons",
				db.query.lesson.findMany({
					where: { program: student.program },
					orderBy: { createdAt: "desc" },
				}),
				[],
			);

			const position = new Map(
				(program?.lessons ?? []).map((id, index) => [id, index]),
			);

			return {
				program: student.program,
				lessons: [...lessons].sort(
					(a, b) =>
						(position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
						(position.get(b.id) ?? Number.MAX_SAFE_INTEGER),
				),
				attendedLessons,
			};
		}),
	update: getRolesProcedure(["admin", "scheduler"])
		.input(
			UpdateStudentSchema.omit({
				createdAt: true,
				updatedAt: true,
			}).required({
				id: true,
			}),
		)
		.handler(async ({ input, context }) => {
			const { id, ...data } = input;

			return await tryAPI(
				"db-core-update-student",
				db
					.update(schema.student)
					.set(data)
					.where(
						MapRole(context.role, {
							admin: eq(schema.student.id, id),
							scheduler: and(
								eq(schema.student.id, id),
								eq(schema.student.supervisorId, context.user.id),
							),
						}),
					)
					.returning(),
			);
		}),
	updateAttendedLessons: getRolesProcedure(["admin", "scheduler"])
		.input(
			SelectStudentSchema.pick({
				id: true,
				attendedLessons: true,
			}),
		)
		.handler(async ({ input, context }) => {
			return await tryAPI(
				"db-core-update-student-attended-lessons",
				db
					.update(schema.student)
					.set({
						attendedLessons: input.attendedLessons,
					})
					.where(
						MapRole(context.role, {
							admin: eq(schema.student.id, input.id),
							scheduler: and(
								eq(schema.student.id, input.id),
								eq(schema.student.supervisorId, context.user.id),
							),
						}),
					)
					.returning(),
			);
		}),
	assignProgram: getRolesProcedure(["admin"])
		.input(
			SelectStudentSchema.pick({ id: true }).extend({
				program: z.string(),
				amount: z.number().int().min(0).optional(),
			}),
		)
		.handler(async ({ input }) => {
			const student = await tryAPI(
				"db-core-assign-program-get-student",
				db.query.student.findFirst({
					where: { id: input.id },
					columns: {
						id: true,
						address: true,
					},
				}),
			);

			if (!student) throw getError("NOT_FOUND", "Student not found");

			const program = await tryAPI(
				"db-core-assign-program-get-program",
				db.query.program.findFirst({
					where: { id: input.program },
				}),
			);

			if (!program) throw getError("NOT_FOUND", "Program not found");

			const amount =
				input.amount ??
				resolveDefaultAmount(program.price, student.address?.country);

			return await tryAPI(
				"db-core-assign-program-update-student",
				db
					.update(schema.student)
					.set({
						program: input.program,
						amount,
						remaining: amount,
						paid: false,
					})
					.where(eq(schema.student.id, input.id))
					.returning(),
			);
		}),
};
