import { eq } from "drizzle-orm";
import { schema } from "@/db";
import { db } from "@/services";

console.log(process.env.DATABASE_URL);

console.log(
	await db
		.update(schema.user)
		.set({ role: "admin" })
		.where(eq(schema.user.id, ""))
		.returning(),
);

console.log(await db.select().from(schema.user));

process.exit();
