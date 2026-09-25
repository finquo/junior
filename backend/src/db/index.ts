import { drizzle } from "drizzle-orm/node-postgres";
import { getRelations as relations } from "./schema/relations";

export function createDb() {
	return drizzle(process.env.DATABASE_URL, { relations });
}

export type Database = ReturnType<typeof createDb>;
