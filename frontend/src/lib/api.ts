import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AppRouterClient } from "backend/api";

export const link = new RPCLink({
	url: `${(process.env.NEXT_PUBLIC_SERVER_URL as string).replace(/\/$/, "")}/rpc`,
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
