import type { scheduler, student, teacher, user } from "@/db/schema";

export * from "@/db/zod";

export type SchedulerType = typeof scheduler.$inferSelect;
export type TeacherType = typeof teacher.$inferSelect;
export type StudentType = typeof student.$inferSelect;
export type UserType = typeof user.$inferSelect;
