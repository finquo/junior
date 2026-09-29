"use client";

import { createAuthClient } from "better-auth/react";
import { authConfig, type SESSION, type USER } from "@/lib/auth";

export const authClient = createAuthClient(authConfig);

export const useAuth = <T extends boolean = false>() => {
	const { data: raw, ...everything } = authClient.useSession();

	const data = raw as Partial<SESSION> | null;
	const session = data?.session;
	const user = data?.user;

	return {
		...everything,
		session,
		impersonation: session?.impersonatedBy,
		data: user as T extends true ? USER : typeof user,
		user,
	};
};
