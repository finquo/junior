import { sql } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
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

// No overlapping active sessions for the same tutor
export async function enableConstraint(db: Database) {
	await db.execute(sql`CREATE EXTENSION IF NOT EXISTS btree_gist;`);

	await db.execute(sql`
	ALTER TABLE "slot" ADD CONSTRAINT slot_no_overlap_teacher_active
		EXCLUDE USING GIST (
			"teacherId" WITH =,
			tstzrange("startTime", "expectedEndTime", '[)') WITH &&
		)
		WHERE (status IN ('scheduled', 'rescheduled', 'started'));
	`);
}
