import { jsonb, pgEnum, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, generateId, getId, updatedAt } from "../utils";
import { lesson } from "./lesson";
import { type Address, student } from "./student";

export const orderStatusEnum = pgEnum("order_status", ["delivered", "packing"]);

export const material = pgTable("material", {
	id: generateId().primaryKey(),
	name: text().notNull(),

	studentId: getId().references(() => student.id, { onDelete: "cascade" }),
	lessons: getId()
		.references(() => lesson.id, { onDelete: "cascade" })
		.array()
		.default([]),

	order: orderStatusEnum().notNull().default("packing"),
	shippingAddress: jsonb().$type<Address>().notNull(),

	createdAt: createdAt(),
	updatedAt: updatedAt(),
});
