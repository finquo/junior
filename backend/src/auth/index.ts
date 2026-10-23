import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { admin as adminPlugin, phoneNumber } from "better-auth/plugins";
import type { Database } from "@/db";
import * as schema from "@/db/schema/auth";
import { ac, roles } from "./permissions";

export * from "./permissions";

export function createAuth(db: Database) {
	return betterAuth({
		appName: "Finquo Junior",
		secret: process.env.BETTER_AUTH_SECRET,
		baseURL: process.env.BETTER_AUTH_URL,
		trustedOrigins: process.env.CORS_ORIGIN
			? [process.env.CORS_ORIGIN]
			: undefined,
		emailAndPassword: {
			enabled: true,
			disableSignUp: false,
		},
		database: drizzleAdapter(db, {
			provider: "pg",
			schema,
			transaction: true,
		}),
		authCookie: { name: "auth-session" },
		onAPIError: {
			errorURL: "/error",
			onError: (error) => {
				console.error("Auth Error:", error);
			},
		},
		logger: {
			level: "debug",
		},
		advanced: {
			cookiePrefix: "finquo-auth",
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		session: {
			cookieCache: {
				enabled: true,
			},
		},
		plugins: [
			adminPlugin({
				defaultRole: "user",
				ac,
				roles,
			}),
			phoneNumber({
				sendOTP: () => {},
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
