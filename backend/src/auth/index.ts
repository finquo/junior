import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import type { Database } from "@/db";
import * as schema from "@/db/schema/auth";

export function createAuth(
	env: {
		BETTER_AUTH_URL: string;
		BETTER_AUTH_SECRET: string;
		CORS_ORIGIN: string;
	},
	database: Database,
	desktopOrigins: readonly string[] = [],
) {
	return betterAuth({
		database: drizzleAdapter(database, {
			provider: "pg",
			schema,
		}),
		trustedOrigins: [env.CORS_ORIGIN, ...desktopOrigins],
		emailAndPassword: { enabled: true },
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,
		advanced: {
			defaultCookieAttributes: {
				sameSite: "none",
				secure: true,
				httpOnly: true,
			},
		},
		plugins: [],
		user: {
			additionalFields: {
				role: {
					type: ["user", "admin"],
					required: true,
					defaultValue: "user",
					input: false,
				},
			},
		},
	});
}

export type AUTH = ReturnType<typeof createAuth>;
export type USER = typeof schema.user.$inferSelect;
export type SESSION = AUTH["$Infer"]["Session"];
