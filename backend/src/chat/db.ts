import { postgresSchemaStatements } from "@chat-adapter/state-pg";

// import { db } from "@/services";

for (const statement of postgresSchemaStatements) {
	// await db.execute(statement);
	console.log(statement);
}
