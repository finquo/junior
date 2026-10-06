import { getColumns, type SQL, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	type PgTable,
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

export function ArrayAppend<Column extends AnyPgColumn>(
	column: Column,
	value: Column["_"]["data"] extends unknown[]
		? Column["_"]["data"][number]
		: any,
) {
	return sql`array_append(${column}, ${value})`;
}

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

export const buildConflictUpdateColumns = <
	T extends PgTable,
	Q extends keyof T["_"]["columns"],
>(
	table: T,
	columns: Q[],
) => {
	const cls = getColumns(table);

	return columns.reduce(
		(acc, column) => {
			const colName = cls[column]?.name;
			acc[column] = sql.raw(`excluded.${colName}`);

			return acc;
		},
		{} as Record<Q, SQL>,
	);
};
