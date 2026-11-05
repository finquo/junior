import "varlock/auto-load";
import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "./src/index.ts",
		lambda: "./src/lambda.ts",
		auth: "./src/auth/export.ts",
		api: "./src/api/export.ts",
		config: "./src/config/index.ts",
		db: "./src/db/export.ts",
	},
	format: "esm",
	outDir: "./out",
	clean: false,
	dts: {
		sourcemap: false,
	},
	sourcemap: false,
	deps: {
		alwaysBundle: ["utils"],
	},
	loader: {
		".pem": "text",
	},
});
