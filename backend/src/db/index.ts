import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import awsRdsPem from "./aws-rds.pem";
import * as schemas from "./schema/index";
import { getRelations as relations } from "./schema/relations";

const isAWS = process.env.DATABASE_URL.includes(".rds.amazonaws.com");

export function createDb() {
	const client = postgres(process.env.DATABASE_URL, {
		prepare: false,
		max: 1,
		// max: undefined,
		ssl: {
			ca: isAWS ? (awsRdsPem as string) : undefined,
			rejectUnauthorized: isAWS,
		},
	});

	return drizzle({ client, relations });
}

export type Database = ReturnType<typeof createDb>;
export const schema = schemas;
