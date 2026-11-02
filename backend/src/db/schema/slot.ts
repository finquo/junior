import { sql } from "drizzle-orm";
import {
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import type { Database } from "..";
import { createdAt, generateId, getId, updatedAt } from "../utils";
import { lesson } from "./lesson";
import { scheduler } from "./scheduler";
import { student } from "./student";
import { teacher } from "./teacher";

export const slotStatusEnum = pgEnum("slot_status", [
	"scheduled",
	"request_reschedule",
	"rescheduled",
	"started",
	"attended",
]);

export const slot = pgTable(
	"slot",
	{
		id: generateId().primaryKey(),
		meetingLink: text(),

		studentId: getId().references(() => student.id, { onDelete: "cascade" }),
		teacherId: getId().references(() => teacher.id, { onDelete: "cascade" }),
		schedulerId: getId().references(() => scheduler.id, {
			onDelete: "cascade",
		}),

		lessonId: getId().references(() => lesson.id, { onDelete: "cascade" }),

		startTime: timestamp({
			withTimezone: true,
			mode: "date",
		}).notNull(),

		expectedEndTime: timestamp({
			withTimezone: true,
			mode: "date",
		}).notNull(),

		endTime: timestamp({
			withTimezone: true,
			mode: "date",
		}),

		status: slotStatusEnum("status").notNull().default("scheduled"),

		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},

	(table) => [
		// Ensure a real interval
		sql`CHECK (${table.startTime} < ${table.expectedEndTime})`,

		index("slot_teacher_student_idx").on(
			table.teacherId,
			table.studentId,
			table.lessonId,
		),

		// Index to speed up teacher slot lookups
		index("slot_teacher_status_time_idx").on(
			table.teacherId,
			table.status,
			table.startTime,
			table.expectedEndTime,
		),
	],
);

export const slotLog = pgTable(
	"slot_log",
	{
		id: generateId().primaryKey(),
		slotId: getId().references(() => slot.id, { onDelete: "cascade" }),
		category: text().notNull(),
		event: text().notNull(),
		data: jsonb().notNull(),
		createdAt: createdAt(),
	},
	(table) => [index("slot_log_idx").on(table.slotId, table.createdAt)],
);
