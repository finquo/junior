import type * as schema from "./schema";

export * from "./zod";

export type SchedulerType = typeof schema.scheduler.$inferSelect;
export type TeacherType = typeof schema.teacher.$inferSelect;
export type StudentType = typeof schema.student.$inferSelect;
export type UserType = typeof schema.user.$inferSelect;
export type ProgramType = typeof schema.program.$inferSelect;
