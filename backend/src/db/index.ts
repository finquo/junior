import { better } from "better-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { getRelations } from "./schema/relations";

export function createDb(env: { DATABASE_URL: string }) {
	return drizzle(env.DATABASE_URL, getRelations());
}

export function createBetterDb(env: { DATABASE_URL: string }) {
	return better(createDb(env), { schema });
}

export type Database = ReturnType<typeof createDb>;
export type BetterDatabase = ReturnType<typeof createBetterDb>;
