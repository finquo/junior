"use client";

import { createAuthClient } from "better-auth/react";
import { authConfig } from "@/lib/auth";
import { useAuth } from "./auth";

const callAuthClient = createAuthClient({
	...authConfig,
	sessionOptions: {
		refetchOnWindowFocus: false,
	},
});

export const useCallAuth: typeof useAuth = (check) =>
	useAuth(check, callAuthClient);
