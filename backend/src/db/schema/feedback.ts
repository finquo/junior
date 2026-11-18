import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, generateId, getTempId, updatedAt } from "../utils";
import { user } from "./auth";

export const feedbackTypes = [
	"join",
	"dashboard",
	"media",
	"bug",
	"confusion",
	"suggestion",
] as const;
export type FeedbackType = (typeof feedbackTypes)[number];

export const feedbackStatuses = [
	"pending",
	"resolved",
	"unresolvable",
] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedback = pgTable("feedback", {
	id: generateId().primaryKey(),
	userId: getTempId().references(() => user.id, { onDelete: "set null" }),

	type: text().$type<FeedbackType>().notNull(),
	content: text().notNull(),
	ref: text(), // <table>:<id>

	status: text().$type<FeedbackStatus>().notNull().default("pending"),
	resolvedBy: getTempId().references(() => user.id, { onDelete: "set null" }),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
