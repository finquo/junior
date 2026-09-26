import { createSelectSchema } from "drizzle-orm/zod";
import type { output as Infer } from "zod";
import * as schema from "./schema";

const SelectUserSchema = createSelectSchema(schema.user);
export type SelectUserType = Infer<typeof SelectUserSchema>;

const SelectSchedulerSchema = createSelectSchema(schema.scheduler);
export type SelectSchedulerType = Infer<typeof SelectSchedulerSchema>;
