import { createSchemaFactory } from "drizzle-orm/zod";
import {
	CountryCurrencies,
	CountryZod,
	CurrencyZod,
	LanguageCodeZod,
} from "utils";
import z, { type ZodObject, type ZodRawShape, type ZodString } from "zod";
import {
	addressZod,
	availabilityZod,
	experienceZod,
	intervalHourZod,
	noteZod,
	quizZod,
	schoolingZod,
} from "@/config";
import * as schema from "./schema/index";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({
		coerce: {
			date: true,
		},
	});

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
	program: z.string().nullable().optional(),
	notes: noteZod.array().optional(),
	address: addressZod.nullable().optional(),
	country: CountryZod.nullable().optional(),
	currency: CurrencyZod.nullable().optional(),
});
export const SelectStudentSchema = createSelectSchema(
	schema.student,
).safeExtend({
	schooling: schoolingZod.nullable(),
	languages: LanguageCodeZod.array(),
	program: z.string().nullable(),
	notes: noteZod.array(),
	address: addressZod.nullable(),
	country: CountryZod.nullable(),
	currency: CurrencyZod.nullable(),
});
export const UpdateStudentSchema = createUpdateSchema(
	schema.student,
).safeExtend({
	schooling: schoolingZod.nullable().optional(),
	languages: LanguageCodeZod.array().optional(),
	program: z.string().nullable().optional(),
	notes: noteZod.array().optional(),
	address: addressZod.nullable().optional(),
	country: CountryZod.nullable().optional(),
	currency: CurrencyZod.nullable().optional(),
});

// Program
const priceZod = z.record(z.string(), z.number());
export const SelectProgramSchema = createSelectSchema(
	schema.program,
).safeExtend({
	price: priceZod,
});
export const InsertProgramSchema = createInsertSchema(
	schema.program,
).safeExtend({
	price: priceZod,
});
export const UpdateProgramSchema = createUpdateSchema(
	schema.program,
).safeExtend({
	price: priceZod,
});

// Slot
export const SelectSlotSchema = createSelectSchema(schema.slot);
export const InsertSlotSchema = createInsertSchema(schema.slot);
export const UpdateSlotSchema = createUpdateSchema(schema.slot);

// Lesson
export const SelectLessonSchema = createSelectSchema(schema.lesson)
	.omit({ period: true })
	.safeExtend({
		language: LanguageCodeZod,
		quiz: quizZod.array(),
		period: intervalHourZod,
	});
export const InsertLessonSchema = createInsertSchema(schema.lesson)
	.omit({ period: true })
	.safeExtend({
		language: LanguageCodeZod,
		quiz: quizZod.array().optional(),
		period: intervalHourZod.optional(),
	});
export const UpdateLessonSchema = createUpdateSchema(schema.lesson)
	.omit({ period: true })
	.safeExtend({
		language: LanguageCodeZod.optional(),
		quiz: quizZod.array().optional(),
		period: intervalHourZod.optional(),
	});

// Payment
export const SelectPaymentSchema = createSelectSchema(schema.payment);
export const InsertPaymentSchema = createInsertSchema(schema.payment);

const updateZod = <T extends ZodObject<{ id: ZodString } & ZodRawShape>>(
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
