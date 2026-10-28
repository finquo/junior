import { writeFileSync } from "node:fs";

const keyRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const content: string[] = [];

if (!process.env.secrets)
	throw new Error("AWS Amplify process.env.secrets is missing or empty.");

const parsedSecrets = JSON.parse(process.env.secrets);

if (typeof parsedSecrets !== "object")
	throw new Error("AWS Amplify process.env.secrets is not parsed");

Object.entries(parsedSecrets).forEach(([key, value]) => {
	if (typeof key === "string" && keyRegex.test(key))
		content.push(`${key}=${JSON.stringify(value ?? "")}`);
});

writeFileSync(".env", `${content.join("\n")}\n`);
