import { createSchemaFactory } from "drizzle-orm/zod";
import type { output as Infer } from "zod";
import * as schema from "./schema";

export const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({
		coerce: {
			date: true,
		},
	});

// Select Schemas
export const SelectUserSchema = createSelectSchema(schema.user);
export type SelectUserType = Infer<typeof SelectUserSchema>;

export const SelectSchedulerSchema = createSelectSchema(schema.scheduler);
export type SelectSchedulerType = Infer<typeof SelectSchedulerSchema>;

export const SelectTeacherSchema = createSelectSchema(schema.teacher);
export type SelectTeacherType = Infer<typeof SelectTeacherSchema>;

export const SelectStudentSchema = createSelectSchema(schema.student);
export type SelectStudentType = Infer<typeof SelectStudentSchema>;

export const SelectSlotSchema = createSelectSchema(schema.slot);
export type SelectSlotType = Infer<typeof SelectSlotSchema>;

export const SelectLessonSchema = createSelectSchema(schema.lesson);
export type SelectLessonType = Infer<typeof SelectLessonSchema>;

// Insert Schemas
export const InsertUserSchema = createInsertSchema(schema.user);
export type InsertUserType = Infer<typeof InsertUserSchema>;

export const InsertSchedulerSchema = createInsertSchema(schema.scheduler);
export type InsertSchedulerType = Infer<typeof InsertSchedulerSchema>;

export const InsertTeacherSchema = createInsertSchema(schema.teacher);
export type InsertTeacherType = Infer<typeof InsertTeacherSchema>;

export const InsertStudentSchema = createInsertSchema(schema.student);
export type InsertStudentType = Infer<typeof InsertStudentSchema>;

export const InsertSlotSchema = createInsertSchema(schema.slot);
export type InsertSlotType = Infer<typeof InsertSlotSchema>;

export const InsertLessonSchema = createInsertSchema(schema.lesson);
export type InsertLessonType = Infer<typeof InsertLessonSchema>;

// Update Schemas
export const UpdateSlotSchema = createUpdateSchema(schema.slot);
export type UpdateSlotType = Infer<typeof UpdateSlotSchema>;

export const UpdateUserSchema = createUpdateSchema(schema.user);
export type UpdateUserType = Infer<typeof UpdateUserSchema>;

export const UpdateTeacherSchema = createUpdateSchema(schema.teacher);
export type UpdateTeacherType = Infer<typeof UpdateTeacherSchema>;

export const UpdateStudentSchema = createUpdateSchema(schema.student);
export type UpdateStudentType = Infer<typeof UpdateStudentSchema>;
