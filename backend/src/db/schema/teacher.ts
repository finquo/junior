import { jsonb, pgTable, text } from "drizzle-orm/pg-core";
import type { LanguageCodes } from "utils";
import type { Experience } from "@/config";
import type { Availability } from "@/config/time";
import { leaveRange } from "../column/leave-range";
import { createdAt, generateId, getTempId, updatedAt } from "../utils";
import { user } from "./auth";
import { scheduler } from "./scheduler";

export const teacher = pgTable("teacher", {
	id: generateId()
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),

	supervisorId: getTempId().references(() => scheduler.id, {
		onDelete: "cascade",
	}),

	experiences: jsonb().$type<Experience[]>().default([]),
	languages: text()
		.$type<LanguageCodes>()
		.array()
		.$default(() => []),

	availability: jsonb().$type<Availability>(),
	leaves: leaveRange().array(),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
