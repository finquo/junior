import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	integer,
	jsonb,
	pgTable,
	text,
} from "drizzle-orm/pg-core";
import type { Currency, Language, PlayKeys } from "@/config";
import type { Address, Note, Schooling } from "@/config/type";
import { createdAt, generateId, getId, getTime, updatedAt } from "../utils";
import { user } from "./auth";
import { scheduler } from "./scheduler";
import { teacher } from "./teacher";

export const student = pgTable(
	"student",
	{
		id: generateId()
			.primaryKey()
			.references(() => user.id, { onDelete: "cascade" }),

		mentorId: getId().references(() => teacher.id),
		supervisorId: getId().references(() => scheduler.id),

		notes: jsonb().$type<Note[]>().default([]).notNull(),
		address: jsonb().$type<Address>(),

		schooling: text().$type<Schooling>(),
		languages: text()
			.$type<Language>()
			.array()
			.$default(() => []),

		program: text().$type<PlayKeys>(),
		lessons: getId().array().default([]),
		meetingLink: text(),

		paid: boolean().notNull(),
		amount: integer().notNull(),
		remaining: integer()
			.notNull()
			.$default(() => 0),

		createdAt: createdAt(),
		updatedAt: updatedAt(),
	},
	(table) => [
		check("amount_positive", sql`${table.amount} >= 0`),
		check("remaining_positive", sql`${table.remaining} >= 0`),
	],
);

// payment log
export const payment = pgTable(
	"payment",
	{
		id: generateId().primaryKey(),
		studentId: text()
			.notNull()
			.references(() => student.id),

		program: text().$type<PlayKeys>().notNull(),
		transactionId: text(),

		amount: integer().notNull(),
		paidAt: getTime(),
		currency: text()
			.$type<Currency>()
			.notNull()
			.$default(() => "₹"),

		createdAt: createdAt(),
	},
	(table) => [check("amount_positive", sql`${table.amount} > 0`)],
);
