import { createHash } from "node:crypto";
import path from "node:path";
import { nitro } from "nitro/vite";
import vinext from "vinext";
import { defineConfig } from "vite";
import { patchCssModules } from "vite-css-modules";

export default defineConfig({
	plugins: [
		patchCssModules({ exportMode: "default" }),
		vinext(),
		nitro({
			preset: "aws_amplify",
			awsAmplify: { runtime: "nodejs24.x" },
		}),
	],
	ssr: {
		external: ["@vercel/oidc"],
	},
	environments: {
		rsc: {
			resolve: { noExternal: ["tailwindcss", "tw-animate-css", "shadcn"] },
		},
		ssr: {
			resolve: { noExternal: ["tailwindcss", "tw-animate-css", "shadcn"] },
		},
	},
	css: {
		modules: {
			generateScopedName(name: string, filename: string) {
				const relativePath = path
					.relative(import.meta.dirname, filename.replace(/\?.*$/, ""))
					.replaceAll("\\", "/");
				return `_${name}_${createHash("sha256").update(relativePath).digest("hex").slice(0, 7)}`;
			},
		},
	},
});
