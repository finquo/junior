import "varlock/auto-load";
import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: "./src/index.ts",
		format: "esm",
		outDir: "./out",
		clean: false,
		dts: {
			sourcemap: false,
		},
		deps: {
			alwaysBundle: ["utils"],
		},
	},
	{
		entry: [
			"./src/auth/export.ts",
			"./src/api/index.ts",
			"./src/config/index.ts",
			"./src/db/export.ts",
		],
		format: "esm",
		outDir: "./dist",
		clean: false,
		dts: {
			sourcemap: false,
		},
		sourcemap: false,
		deps: {
			alwaysBundle: ["utils"],
		},
	},
]);
