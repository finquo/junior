import { createSelectSchema } from "drizzle-orm/zod";
import type { output as Infer } from "zod";
import * as schema from "./schema";

const SelectUserSchema = createSelectSchema(schema.user);
export type SelectUserType = Infer<typeof SelectUserSchema>;

const SelectSchedulerSchema = createSelectSchema(schema.scheduler);
export type SelectSchedulerType = Infer<typeof SelectSchedulerSchema>;

const SelectTeacherSchema = createSelectSchema(schema.teacher);
export type SelectTeacherType = Infer<typeof SelectTeacherSchema>;

const SelectStudentSchema = createSelectSchema(schema.student);
export type SelectStudentType = Infer<typeof SelectStudentSchema>;
