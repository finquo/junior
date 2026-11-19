import "varlock/auto-load";
import { defineConfig } from "tsdown";

export default defineConfig([
	{
		name: "event",
		entry: { index: "./src/lambda.ts" },
		format: "esm",
		outDir: "./event",
		clean: true,
		dts: false,
		deps: {
			alwaysBundle: [/.*/],
			onlyBundle: false,
		},
		loader: {
			".pem": "text",
		},
	},
]);
