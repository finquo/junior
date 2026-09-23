import { interval, jsonb, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import type { Anwser, Quiz } from "@/config/quiz";
import { createdAt, generateId, getId, updatedAt } from "../utils";
import { student } from "./student";

export const lesson = pgTable("lesson", {
	id: generateId().primaryKey(),

	name: text().notNull(),
	description: text(),

	quiz: jsonb().$type<Quiz>(),
	period: interval({ fields: "hour to minute" }),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});

export const answerStatusEnum = pgEnum("answer_status", [
	"pending",
	"answered",
	"correct",
	"partially_correct",
	"wrong",
	"retry",
]);

export const answer = pgTable("answer", {
	id: generateId().primaryKey(),
	studentId: getId().references(() => student.id, { onDelete: "cascade" }),

	lesson: getId().references(() => lesson.id, { onDelete: "cascade" }),
	status: answerStatusEnum().notNull().default("pending"),

	answer: jsonb().$type<Anwser>(),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
