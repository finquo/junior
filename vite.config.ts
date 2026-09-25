import { varlockCloudflareVitePlugin } from "@varlock/cloudflare-integration";
import { defineConfig } from "vite-plus";

export default defineConfig({
	plugins: [varlockCloudflareVitePlugin()],
	lint: {
		ignorePatterns: [
			"node_modules/**",
			"**/node_modules/**",
			"frontend/.next/**",
			"frontend/out/**",
			"backend/out/**",
			"backend/dist/**",
			"packages/*/dist/**",
		],
		options: {
			typeAware: false,
			typeCheck: false,
		},
	},
	fmt: {
		ignorePatterns: [
			"node_modules/**",
			"**/node_modules/**",
			"frontend/.next/**",
			"frontend/out/**",
			"backend/out/**",
			"backend/dist/**",
			"packages/*/dist/**",
		],
		singleQuote: false,
		semi: true,
		sortPackageJson: true,
	},
	staged: {
		"*.{js,ts,jsx,tsx,json,jsonc,css,md}": "vp check --fix",
	},
});
