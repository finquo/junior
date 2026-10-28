import { writeFileSync } from "node:fs";

const envKeyRegex = /^[A-Z_][A-Z0-9_]*$/;
const content: string[] = [];

Object.entries(process.env).forEach(([key, value]) => {
	if (typeof key === "string" && envKeyRegex.test(key))
		content.push(`${key}=${JSON.stringify(value ?? "")}`);
});

writeFileSync(".env", `${content.join("\n")}\n`);
