import { drizzle } from "drizzle-orm/node-postgres";
import { getRelations } from "./schema/relations";

export function createDb(env: { DATABASE_URL: string }) {
	return drizzle(env.DATABASE_URL, getRelations());
}

export type Database = ReturnType<typeof createDb>;

export * from "./schema";
