import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CountryCodes } from "utils";
import { createdAt, getId, updatedAt } from "../utils";

export const program = pgTable("program", {
	id: getId().primaryKey(),

	name: text().notNull(),
	description: text(),
	price: jsonb()
		.$type<Partial<Record<CountryCodes, number>>>()
		.default({})
		.notNull(),

	lessons: getId().array().default([]),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
