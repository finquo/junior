import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import type { PlayKeys } from "@/config/plans";
import { createdAt, generateId, getId, updatedAt } from "../utils";
import { user } from "./auth";
import { scheduler } from "./scheduler";
import { teacher } from "./teacher";

export const student = pgTable("student", {
	id: generateId().primaryKey(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	mentorId: getId().references(() => teacher.id, { onDelete: "cascade" }),
	schedulerId: getId().references(() => scheduler.id, { onDelete: "cascade" }),

	address: text(),

	program: text().$type<PlayKeys>(),
	paid: boolean().notNull(),
	lessons: getId().array().default([]),

	meetingLink: text(),

	preferedLanguage: text()
		.array()
		.$default(() => []),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
