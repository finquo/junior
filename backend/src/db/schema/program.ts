import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CountryCodes } from "@/config";
import { createdAt, getId, updatedAt } from "../utils";

/**
 * Program curriculum ordering source of truth.
 *
 * Program membership of a lesson is derived from `lesson.program`; the
 * `lessons` array only records the order in which a student should attend
 * the lessons of this program ("lessons to watch").
 */
export const program = pgTable("program", {
	id: getId().primaryKey(),

	name: text().notNull(),
	description: text(),
	count: integer().notNull().default(0),
	price: jsonb()
		.$type<Partial<Record<CountryCodes, number>>>()
		.default({})
		.notNull(),

	lessons: getId().array().default([]),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
