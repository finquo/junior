import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { Experience, Language } from "@/config";
import { createdAt, generateId, getId, updatedAt } from "../utils";
import { user } from "./auth";
import { scheduler } from "./scheduler";

export const teacher = pgTable("teacher", {
	id: generateId().primaryKey(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	schedulerId: getId().references(() => scheduler.id, { onDelete: "cascade" }),

	experiences: jsonb().$type<Experience[]>().default([]),
	languages: text()
		.$type<Language>()
		.array()
		.$default(() => []),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
