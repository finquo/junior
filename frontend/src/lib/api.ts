import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import type { AppRouter, AppRouterClient } from "backend/api";
import { getServerBaseUrl } from "@/hooks/url";

export const link = new RPCLink({
	origin: getServerBaseUrl(),
	url: "/api",
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
	headers: async () => {
		if (typeof window !== "undefined") {
			return {};
		}

		const { headers } = await import("next/headers");
		return Object.fromEntries(await headers());
	},
});

export const orpc: AppRouterClient = createORPCClient(link);

export type API_Returns = InferRouterOutputs<AppRouter>;
export type API_Params = InferRouterInputs<AppRouter>;
