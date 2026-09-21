"use client";

import { createAuthClient } from "better-auth/react";
import { authConfig, type USER } from "@/lib/auth";

export const authClient = createAuthClient(authConfig);

export const useAuth = <T extends boolean = false>() => {
	const { data, ...everything } = authClient.useSession();
	return {
		...everything,
		session: data?.session ?? null,
		data: (data?.user ?? null) as T extends true ? USER : USER | null,
	};
};
