import type { AUTH } from "backend/auth";
// import { ac, roles } from "backend/auth";
import {
	type BetterAuthClientOptions,
	createAuthClient,
} from "better-auth/client";
import {
	adminClient,
	inferAdditionalFields,
	magicLinkClient,
	phoneNumberClient,
} from "better-auth/client/plugins";
import { sileo as toast } from "sileo";

export type { Role, SESSION, USER } from "backend/auth";

export const authConfig = {
	plugins: [
		inferAdditionalFields<AUTH>(),
		magicLinkClient(),
		phoneNumberClient(),
		adminClient({}),
		// adminClient({ ac, roles }),
	],
	...(process.env.NEXT_PUBLIC_SERVER_URL
		? { baseURL: process.env.NEXT_PUBLIC_SERVER_URL }
		: {}),
	fetchOptions: {
		onError: ({ error }) => {
			toast.error({
				title: error.name,
				description: error.message,
			});
		},
	},
} satisfies BetterAuthClientOptions;

export const authClient = createAuthClient(authConfig);
