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
} from "better-auth/client/plugins";
import { sileo as toast } from "sileo";

export type { Role, SESSION, USER } from "backend/auth";

export const authConfig = {
	plugins: [
		inferAdditionalFields<AUTH>(),
		magicLinkClient(),
		adminClient({
			// ac,
			// roles,
		}),
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
	// Do not refetch the session when the user switches tabs/windows. On the
	// call screen this briefly flips useAuth back to pending and unmounts the
	// whole Zoom session, which looks like a full page refresh.
	sessionOptions: {
		refetchOnWindowFocus: false,
	},
} satisfies BetterAuthClientOptions;

export const authClient = createAuthClient(authConfig);
