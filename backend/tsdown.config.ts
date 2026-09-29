import "varlock/auto-load";
import { defineConfig } from "tsdown";

export default defineConfig([
	{
		entry: "./src/index.ts",
		format: "esm",
		outDir: "./out",
		clean: true,
		dts: false,
		sourcemap: false,
		deps: {
			alwaysBundle: ["utils"],
		},
	},
	{
		entry: [
			"./src/auth/export.ts",
			"./src/api/index.ts",
			"./src/config/index.ts",
		],
		format: "esm",
		outDir: "./dist",
		clean: true,
		dts: {
			sourcemap: false,
		},
		sourcemap: false,
	},
]);
