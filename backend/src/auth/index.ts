import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { createDb } from "@/db";
import * as schema from "@/db/schema/auth";
import { ac, roles } from "./permissions";

export * from "./permissions";

export function createAuth(
	env: {
		DATABASE_URL: string;
		BETTER_AUTH_URL: string;
		BETTER_AUTH_SECRET: string;
		CORS_ORIGIN: string;
	},
	desktopOrigins: readonly string[] = [],
) {
	return betterAuth({
		appName: "Finquo Junior",
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		trustedOrigins: [env.CORS_ORIGIN, ...desktopOrigins],
		emailAndPassword: {
			enabled: true,
			disableSignUp: false,
			sendResetPassword: async (data) => {},
		},
		database: drizzleAdapter(createDb(env), {
			provider: "pg",
			schema,
		}),
		authCookie: { name: "auth-session" },
		onAPIError: {
			errorURL: "/error",
			onError: (error) => {
				console.error("Auth Error:", error);
			},
		},
		advanced: {
			cookiePrefix: "finquo-auth",
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		plugins: [
			adminPlugin({
				adminRoles: ["admin", "scheduler"],
				defaultRole: "student",
				ac,
				roles,
			}),
		],
	});
}

export type AUTH = ReturnType<typeof createAuth>;
export type USER = typeof schema.user.$inferSelect;
export type SESSION = {
	session: AUTH["$Infer"]["Session"]["session"];
	user: USER;
};
