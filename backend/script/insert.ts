import { eq } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { schema } from "@/db";
import { db } from "@/services";

const query = db
	.select()
	.from(schema.program)
	.where(eq(schema.program.id, "1"));

const sqlWithParams = query.getSQL().inlineParams();

const pgDialect = new PgDialect();
const rawSqlString = pgDialect.sqlToQuery(sqlWithParams).sql;

console.log(rawSqlString);

process.exit();
