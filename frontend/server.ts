import backend from "backend";
import type { ExecutionContext } from "typeflare";

// @ts-expect-error
import { default as frontend } from "./.open-next/worker.js";

// @ts-expect-error
export * from "./.open-next/worker.js";

export default {
	async fetch(
		request: Request,
		env: Record<string, string>,
		ctx: ExecutionContext,
	) {
		const url = new URL(request.url);

		if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
			return backend.fetch(request, env, ctx);
		}

		return frontend.fetch(request, env, ctx);
	},
};
