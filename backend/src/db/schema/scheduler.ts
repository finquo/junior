import { pgTable } from "drizzle-orm/pg-core";
import { createdAt, generateId, updatedAt } from "../utils";
import { user } from "./auth";

export const scheduler = pgTable("scheduler", {
	id: generateId()
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
