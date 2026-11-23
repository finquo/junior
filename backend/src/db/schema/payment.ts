import { sql } from "drizzle-orm";
import { char, check, integer, pgTable, text } from "drizzle-orm/pg-core";
import type { CurrencyCodes } from "utils";
import { PaymentMethods } from "@/config/payment";
import { createdAt, generateId, getId, getTime } from "../utils";
import { course } from "./course";
import { program } from "./program";
import { student } from "./student";

export const programPayment = pgTable(
	"program_payment",
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
		paymentMethod: text({ enum: PaymentMethods }).notNull(),

		createdAt: createdAt(),
	},
	(table) => [check("amount_positive", sql`${table.amount} > 0`)],
);

export const coursePayment = pgTable(
	"course_payment",
	{
		id: generateId().primaryKey(),
		studentId: text()
			.notNull()
			.references(() => student.id, { onDelete: "cascade" }),

		course: getId()
			.notNull()
			.references(() => course.id, { onDelete: "cascade" }),
		transactionId: text(),

		amount: integer().notNull(),
		paidAt: getTime(),
		currency: char({ length: 3 })
			.$type<CurrencyCodes>()
			.notNull()
			.$default(() => "INR"),
		paymentMethod: text({ enum: PaymentMethods }).notNull(),

		createdAt: createdAt(),
	},
	(table) => [check("amount_positive", sql`${table.amount} > 0`)],
);
