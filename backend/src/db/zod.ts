import { createSchemaFactory } from "drizzle-orm/zod";
import {
	CountryZod,
	CurrencyZod,
	LanguageCodeZod,
	PhoneNumberZod,
} from "utils";
import z, { type ZodObject, type ZodRawShape, type ZodString } from "zod";
import { roleEnumZod } from "@/auth/permissions";
import {
	addressZod,
	availabilityZod,
	experienceZod,
	intervalHourZod,
	noteZod,
	quizZod,
	schoolingZod,
	slotParticipantZod,
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
export const InsertUserSchema = createInsertSchema(schema.user).safeExtend({
	role: roleEnumZod,
	phoneNumber: PhoneNumberZod.nullable().optional(),
});
export const UpdateUserSchema = createUpdateSchema(schema.user).safeExtend({
	role: roleEnumZod.optional(),
	phoneNumber: PhoneNumberZod.optional(),
});

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
	currentAddress: addressZod.nullable().optional(),
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
	currentAddress: addressZod.nullable(),
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
	currentAddress: addressZod.nullable().optional(),
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
export const SelectSlotSchema = createSelectSchema(schema.slot).safeExtend({
	participants: slotParticipantZod.array(),
});
export const InsertSlotSchema = createInsertSchema(schema.slot).omit({
	participants: true,
});
export const UpdateSlotSchema = createUpdateSchema(schema.slot).omit({
	participants: true,
});

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

// Material
export const OrderStatusZod = z.enum(schema.orderStatusEnum.enumValues);
export const SelectMaterialSchema = createSelectSchema(
	schema.material,
).safeExtend({
	order: OrderStatusZod,
	lessons: z.string().array(),
	shippingAddress: addressZod,
});
export const InsertMaterialSchema = createInsertSchema(
	schema.material,
).safeExtend({
	order: OrderStatusZod.optional(),
	lessons: z.string().array().optional(),
	shippingAddress: addressZod,
});
export const UpdateMaterialSchema = createUpdateSchema(
	schema.material,
).safeExtend({
	order: OrderStatusZod.optional(),
	lessons: z.string().array().optional(),
	shippingAddress: addressZod.optional(),
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
