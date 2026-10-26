import { defineConfig } from "drizzle-kit";
import "varlock/auto-load";
import fs from "node:fs";
import path from "node:path";

const isAWS = process.env.DATABASE_URL.includes(".rds.amazonaws.com");

const awsRdsPem = fs.readFileSync(
	path.resolve(__dirname, "src/db/aws-rds.pem"),
	"utf8",
);

const url = new URL(process.env.DATABASE_URL);

if (isAWS) {
	url.searchParams.delete("sslmode");
	url.searchParams.set("sslmode", "no-verify");
}

export default defineConfig({
	schema: "./src/db/schema/index.ts",
	out: "./migrations",
	dialect: "postgresql",
	dbCredentials: {
		url: url.toString(),
		ssl: {
			rejectUnauthorized: isAWS,
			ca: isAWS ? awsRdsPem : undefined,
		},
	},
});
