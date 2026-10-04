import { createSchemaFactory } from "drizzle-orm/zod";
import {
	type ZodObject,
	type ZodRawShape,
	type ZodString,
	type ZodTypeAny,
	z,
} from "zod";
import {
	addressZod,
	availabilityZod,
	experienceZod,
	LanguageCodeZod,
	noteZod,
	type PlayKeys,
	planKeys,
	schoolingZod,
} from "@/config";
import * as schema from "./schema";

export const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({
		coerce: {
			date: true,
		},
	});

export const ProgramZod = z.enum(planKeys as [PlayKeys, ...PlayKeys[]]);

// User
export const SelectUserSchema = createSelectSchema(schema.user);
export const InsertUserSchema = createInsertSchema(schema.user);
export const UpdateUserSchema = createUpdateSchema(schema.user);

// Teacher
export const InsertTeacherSchema = createInsertSchema(
	schema.teacher,
).safeExtend({
	languages: LanguageCodeZod.array().optional(),
	availability: availabilityZod.nullable().optional(),
	experiences: experienceZod.array().optional(),
});
export const SelectTeacherSchema = createSelectSchema(
	schema.teacher,
).safeExtend({
	languages: LanguageCodeZod.array(),
	availability: availabilityZod.nullable(),
	experiences: experienceZod.array(),
});
export const UpdateTeacherSchema = createUpdateSchema(
	schema.teacher,
).safeExtend({
	languages: LanguageCodeZod.array().optional(),
	availability: availabilityZod.optional(),
	experiences: experienceZod.array().optional(),
});

// Student
export const InsertStudentSchema = createInsertSchema(
	schema.student,
).safeExtend({
	schooling: schoolingZod.optional(),
	languages: LanguageCodeZod.array().optional(),
	program: ProgramZod.nullable().optional(),
	notes: noteZod.array().optional(),
	address: addressZod.nullable().optional(),
});
export const SelectStudentSchema = createSelectSchema(
	schema.student,
).safeExtend({
	schooling: schoolingZod.nullable(),
	languages: LanguageCodeZod.array(),
	program: ProgramZod.nullable(),
	notes: noteZod.array(),
	address: addressZod.nullable(),
});
export const UpdateStudentSchema = createUpdateSchema(
	schema.student,
).safeExtend({
	schooling: schoolingZod.nullable().optional(),
	languages: LanguageCodeZod.array().optional(),
	program: ProgramZod.nullable(),
	notes: noteZod.array().optional(),
	address: addressZod.optional(),
});

// Slot
export const SelectSlotSchema = createSelectSchema(schema.slot);
export const InsertSlotSchema = createInsertSchema(schema.slot);
export const UpdateSlotSchema = createUpdateSchema(schema.slot);

export const SelectLessonSchema = createSelectSchema(schema.lesson).safeExtend({
	language: LanguageCodeZod,
});
export const InsertLessonSchema = createInsertSchema(schema.lesson).safeExtend({
	language: LanguageCodeZod,
});

export const updateZod = <T extends ZodObject<{ id: ZodString } & ZodRawShape>>(
	schema: T,
) =>
	schema
		.pick({
			id: true,
		})
		.extend({
			data: schema
				.omit({
					id: true,
				})
				.partial(),
		});
