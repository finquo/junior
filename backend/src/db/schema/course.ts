import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { CountryCodes, LanguageCodes } from "utils";
import type { Anwser, Quiz } from "@/config";
import { createdAt, generateId, getId, updatedAt } from "../utils";
import { answerStatusEnum } from "./common";
import { student } from "./student";

export const course = pgTable(
	"course",
	{
		id: generateId().primaryKey(),

		name: text().notNull(),
		description: text(),
		language: text().$type<LanguageCodes>().notNull(),

		price: jsonb()
			.$type<Partial<Record<CountryCodes, number>>>()
			.default({})
			.notNull(),

		modules: getId().array().default([]),

		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(table) => [
		index("course_name_trigram_idx").using(
			"gin",
			sql`${table.name} gin_trgm_ops`,
		),
	],
);

export const module = pgTable(
	"module",
	{
		id: generateId().primaryKey(),
		course: getId().references(() => course.id, { onDelete: "cascade" }),

		name: text().notNull(),
		description: text(),
		quiz: jsonb().$type<Quiz[]>(),

		videos: getId().array().default([]),

		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(table) => [
		index("module_name_trigram_idx").using(
			"gin",
			sql`${table.name} gin_trgm_ops`,
		),
	],
);

export const video = pgTable(
	"video",
	{
		id: generateId().primaryKey(),
		course: getId().references(() => course.id, { onDelete: "cascade" }),
		module: getId().references(() => module.id, { onDelete: "cascade" }),

		name: text().notNull(),
		description: text(),

		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(table) => [
		index("video_name_trigram_idx").using(
			"gin",
			sql`${table.name} gin_trgm_ops`,
		),
	],
);

export const moduleAnwser = pgTable("module_anwser", {
	id: generateId().primaryKey(),
	studentId: text()
		.notNull()
		.references(() => student.id, { onDelete: "cascade" }),

	moduleId: getId()
		.notNull()
		.references(() => module.id, { onDelete: "cascade" }),
	status: answerStatusEnum().notNull().default("pending"),

	answer: jsonb().$type<Anwser>(),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
