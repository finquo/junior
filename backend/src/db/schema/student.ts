import { sql } from "drizzle-orm";
import {
	boolean,
	char,
	check,
	integer,
	jsonb,
	pgTable,
	smallint,
	text,
} from "drizzle-orm/pg-core";
import type { CountryCodes, CurrencyCodes, LanguageCodes } from "utils";
import type { Address, Note, Schooling } from "@/config/profile";
import {
	createdAt,
	generateId,
	getId,
	getTempId,
	getTime,
	updatedAt,
} from "../utils";
import { user } from "./auth";
import { program } from "./program";
import { scheduler } from "./scheduler";
import { teacher } from "./teacher";

export const student = pgTable(
	"student",
	{
		id: generateId()
			.primaryKey()
			.references(() => user.id, { onDelete: "cascade" }),

		mentorId: getTempId().references(() => teacher.id),
		supervisorId: getTempId().references(() => scheduler.id),

		notes: jsonb().$type<Note[]>().default([]).notNull(),
		address: jsonb().$type<Address>(),

		age: smallint(),
		grade: smallint(),
		schooling: text().$type<Schooling>(),
		country: char({ length: 2 })
			.$type<CountryCodes>()
			.$default(() => "IN"),
		languages: text()
			.$type<LanguageCodes>()
			.array()
			.$default(() => []),

		program: getTempId().references(() => program.id),
		attendedLessons: getId().array().default([]),

		currency: char({ length: 3 })
			.$type<CurrencyCodes>()
			.$default(() => "INR"),
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
		check("age_range_check", sql`${table.age} >= 0 AND ${table.age} <= 120`),
		check(
			"grade_range_check",
			sql`${table.grade} >= 1 AND ${table.grade} <= 12`,
		),
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

		program: text()
			.notNull()
			.references(() => program.id),
		transactionId: text(),

		amount: integer().notNull(),
		paidAt: getTime(),
		currency: char({ length: 3 })
			.$type<CurrencyCodes>()
			.notNull()
			.$default(() => "INR"),

		createdAt: createdAt(),
	},
	(table) => [check("amount_positive", sql`${table.amount} > 0`)],
);
