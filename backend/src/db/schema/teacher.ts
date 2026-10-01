import { interval, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { Experience, LanguageCodes } from "@/config";
import type { Availability } from "@/config/time";
import { tstzrange } from "../tstzrange";
import { createdAt, generateId, getId, updatedAt } from "../utils";
import { user } from "./auth";
import { scheduler } from "./scheduler";

export const teacher = pgTable("teacher", {
	id: generateId()
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),

	supervisorId: getId().references(() => scheduler.id, { onDelete: "cascade" }),

	experiences: jsonb().$type<Experience[]>().default([]),
	languages: text()
		.$type<LanguageCodes>()
		.array()
		.$default(() => []),

	availability: jsonb().$type<Availability>(),
	dateLeaves: tstzrange().array(),
	timeLeaves: interval().array(),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
