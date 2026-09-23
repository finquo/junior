import { defineConfig } from "drizzle-kit";
import "varlock/auto-load";

export default defineConfig({
	schema: "./src/db/schema/index.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL || "",
	},
});
