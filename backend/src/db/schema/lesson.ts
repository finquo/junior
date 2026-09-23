import { interval, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, generateId, getId, updatedAt } from "../utils";

export const lesson = pgTable("lesson", {
	id: generateId().primaryKey(),

	name: text().notNull(),
	description: text(),

	period: interval({ fields: "hour to minute" }),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const material = pgTable("material", {
	id: generateId().primaryKey(),

	name: text().notNull(),
	lessons: getId().array().default([]),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
