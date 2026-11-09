import { eq } from "drizzle-orm";
import z from "zod";
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

const getMaterialStudentId = async (id: string) => {
	const material = await tryAPI(
		"db-core-get-material-student",
		db.query.material.findFirst({
			where: { id },
			columns: { studentId: true },
		}),
	);

	return material?.studentId ?? undefined;
};

const resolveProgramMaterial = async (
	studentId: string | null | undefined,
	programMaterialId: string,
) => {
	if (!studentId) throw getError("INPUT_VALIDATION_FAILED", "Select a student");

	const student = await tryAPI(
		"db-core-material-get-student",
		db.query.student.findFirst({
			where: { id: studentId },
			columns: { program: true },
		}),
	);

	if (!student?.program)
		throw getError(
			"INPUT_VALIDATION_FAILED",
			"Assign a program to the student first",
		);

	const program = await tryAPI(
		"db-core-material-get-program",
		db.query.program.findFirst({
			where: { id: student.program },
			columns: { materials: true },
		}),
	);

	const programMaterial = program?.materials.find(
		(material) => material.id === programMaterialId,
	);

	if (!programMaterial)
		throw getError("NOT_FOUND", "Material not found in the student's program");

	return programMaterial;
};

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
				name: true,
				lessons: true,
				programMaterialId: true,
			}).extend({
				programMaterialId: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const schedulerId =
				context.role === "admin" ? input.schedulerId : context.user.id;

			const programMaterial = await resolveProgramMaterial(
				input.studentId,
				input.programMaterialId,
			);

			return await tryAPI(
				"db-core-create-material",
				db
					.insert(schema.material)
					.values({
						...input,
						schedulerId,
						name: programMaterial.name,
						lessons: programMaterial.lessons,
						programMaterialId: programMaterial.id,
					})
					.returning(),
			);
		}),
	update: getRolesProcedure(["admin", "scheduler"])
		.input(
			UpdateMaterialSchema.omit({
				name: true,
				lessons: true,
				programMaterialId: true,
			})
				.required({ id: true })
				.extend({
					programMaterialId: z.string().optional(),
				}),
		)
		.handler(async ({ input, context }) => {
			if (input.schedulerId !== undefined && context.role !== "admin")
				throw getError("FORBIDDEN", "Only admins can change the scheduler");

			const programMaterial =
				input.programMaterialId === undefined
					? undefined
					: await resolveProgramMaterial(
							input.studentId ?? (await getMaterialStudentId(input.id)),
							input.programMaterialId,
						);

			return await tryAPI(
				"db-core-update-material",
				db
					.update(schema.material)
					.set({
						...input,
						name: programMaterial?.name,
						lessons: programMaterial?.lessons,
						programMaterialId: programMaterial?.id,
					})
					.where(eq(schema.material.id, input.id))
					.returning(),
			);
		}),
};
