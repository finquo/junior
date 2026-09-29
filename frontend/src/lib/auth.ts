import { type AUTH, ac, roles } from "backend/auth";
import {
	type BetterAuthClientOptions,
	createAuthClient,
} from "better-auth/client";
import {
	adminClient,
	inferAdditionalFields,
	magicLinkClient,
} from "better-auth/client/plugins";

export type { Role, SESSION, USER } from "backend/auth";

export const authConfig = {
	plugins: [
		inferAdditionalFields<AUTH>(),
		magicLinkClient(),
		adminClient({
			ac,
			roles,
		}),
	],
	...(process.env.NEXT_PUBLIC_SERVER_URL
		? { baseURL: process.env.NEXT_PUBLIC_SERVER_URL }
		: {}),
} satisfies BetterAuthClientOptions;

export const authClient = createAuthClient(authConfig);
