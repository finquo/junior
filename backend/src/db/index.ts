import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schemas from "./schema/index";
import { getRelations as relations } from "./schema/relations";

export function createDb() {
	const client = postgres(process.env.DATABASE_URL, {
		prepare: false,
		max: 1,
	});

	return drizzle({ client, relations });
}

export type Database = ReturnType<typeof createDb>;
export const schema = schemas;
