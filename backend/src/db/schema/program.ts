import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CountryCodes } from "utils";
import type { ProgramMaterial } from "@/config/program";
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
	materials: jsonb().$type<ProgramMaterial[]>().default([]).notNull(),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
