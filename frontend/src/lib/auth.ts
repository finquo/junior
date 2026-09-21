import type { AUTH } from "backend/auth";
import {
	type BetterAuthClientOptions,
	createAuthClient,
} from "better-auth/client";
import {
	inferAdditionalFields,
	magicLinkClient,
} from "better-auth/client/plugins";

export type { USER } from "backend/auth";

export const authConfig = {
	plugins: [inferAdditionalFields<AUTH>(), magicLinkClient()],
	...(process.env.NEXT_PUBLIC_SERVER_URL
		? { baseURL: process.env.NEXT_PUBLIC_SERVER_URL }
		: {}),
} satisfies BetterAuthClientOptions;

export const authClient = createAuthClient(authConfig);
