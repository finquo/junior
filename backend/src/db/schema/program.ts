import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CountryCodes } from "utils";
import type { ProgramMaterial } from "@/config/program";
import { createdAt, getId, updatedAt } from "../utils";

export const program = pgTable(
	"program",
	{
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
	},
	(table) => [
		index("program_name_trigram_idx").using(
			"gin",
			sql`${table.name} gin_trgm_ops`,
		),
	],
);
