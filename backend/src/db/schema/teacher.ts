import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, generateId, getId, updatedAt } from "../utils";
import { user } from "./auth";
import { scheduler } from "./scheduler";

type Experience = {
	title: string; // e.g. "Senior Math Teacher"
	organization: string; // e.g. "Greenwood High School"
	description?: string; // optional details
	startedAt: string; // ISO date
	endedAt?: string; // ISO date or undefined if current
	writtenBy: string; // who recorded/updated this entry
	createdAt: string; // ISO timestamp of this version
};

export const teacher = pgTable("teacher", {
	id: generateId().primaryKey(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	schedulerId: getId().references(() => scheduler.id, { onDelete: "cascade" }),

	experiences: jsonb().$type<Experience[]>().default([]),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
