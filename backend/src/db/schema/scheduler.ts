import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, generateId, updatedAt } from "../utils";
import { user } from "./auth";

export const scheduler = pgTable("scheduler", {
	id: generateId().primaryKey(),
	userId: text()
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
