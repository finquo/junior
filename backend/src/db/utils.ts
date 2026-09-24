import { sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	type SubqueryWithSelection,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import type { Database } from ".";

export const Increment = (column: AnyPgColumn, value = 1) => {
	return sql`${column} + ${value}`;
};

export const Decrement = (column: AnyPgColumn, value = 1) => {
	return sql`${column} - ${value}`;
};

export const Multipy = (column: AnyPgColumn, value = 1) => {
	return sql`${column} * ${value}`;
};

export const AddToArray = <T extends AnyPgColumn>(column: T, data: any) => {
	return sql`${column} || ${[data]}`; // Append userId to the array
};

export const createdAt = (name = "created_at") =>
	timestamp(name, { withTimezone: false }).default(sql`now()`).notNull();

export const getTime = () => timestamp({ withTimezone: false });

export const updatedAt = (name = "updated_at") =>
	timestamp(name, { withTimezone: false })
		.default(sql`now()`)
		.$onUpdate(() => new Date())
		.notNull();

export const getId = () => text().notNull();
export const generateId = () =>
	text().default(sql`gen_random_uuid()`).notNull();

export async function enableTrigramExtension(db: Database) {
	await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
}

export const getSubQueryTableColumns = <
	T extends SubqueryWithSelection<any, string>,
>(
	table: T,
) => table._.selectedFields;

export function JsonbArrayAppend<Column extends AnyPgColumn>(
	column: Column,
	value: Column["_"]["data"] extends unknown[]
		? Column["_"]["data"][number]
		: never,
) {
	// return sql`${column} || ${JSON.stringify(value)}::jsonb`;
	return sql`coalesce(${column}, '[]'::jsonb) || ${JSON.stringify(value)}::jsonb`;
}
