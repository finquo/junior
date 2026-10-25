import { defineConfig } from "drizzle-kit";
import awsRdsPem from "@/db/aws-rds.pem";
import "varlock/auto-load";

const isAWS = process.env.DATABASE_URL.includes(".rds.amazonaws.com");

export default defineConfig({
	schema: "./src/db/schema/index.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: isAWS,
			ca: isAWS ? (awsRdsPem as string) : undefined,
		},
	},
});
