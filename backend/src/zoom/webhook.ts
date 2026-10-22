import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { trys } from "utils";
import type { ZoomSessionKeys, ZoomSessions } from "./event";
import { hmacSha256Hex, timingSafeEqual, tryAPI } from "./jwt";

type Payload<
	D extends { [key: string]: unknown } = {
		plainToken?: string;
		download_token?: string;
		account_id?: string;
		object?: Record<string, unknown>;
		[key: string]: unknown;
	},
> = {
	event: string;
	event_ts?: number;
	download_token?: string;
	payload?: D;
};

type ZoomWebhookEnv<D extends object | undefined = Payload["payload"]> = {
	Variables: {
		data?: D;
		category: string;
		event: string;
		timestamp?: number;
		downloadToken?: string;
	};
};

export const zoomWebhookMiddleware = createMiddleware<ZoomWebhookEnv>(
	async (c, next) => {
		const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
		const timestamp = c.req.header("x-zm-request-timestamp");
		const signature = c.req.header("x-zm-signature");
		const rawBody = await c.req.text();

		if (!timestamp || !signature)
			return c.json({ message: "Unauthorized request." }, 401);

		const hashForVerify = hmacSha256Hex(secret, `v0:${timestamp}:${rawBody}`);

		if (!timingSafeEqual(signature, `v0=${hashForVerify}`))
			return c.json({ message: "Unauthorized request." }, 401);

		const { data: body, error } = trys<Payload>(() => JSON.parse(rawBody));

		if (error) return c.json({ message: "Invalid JSON payload." }, 400);

		if (body.event === "endpoint.url_validation") {
			const plainToken = body.payload?.plainToken ?? "";

			return c.json(
				{
					plainToken,
					encryptedToken: hmacSha256Hex(secret, plainToken),
				},
				200,
			);
		}

		c.set("data", body.payload);
		const [category, event] = body.event.split(".");

		if (!category || !event)
			return c.json({ message: "Invalid webhook event." }, 400);

		c.set("category", category);
		c.set("event", event);
		c.set("timestamp", body.event_ts);
		c.set("downloadToken", body.download_token);

		await next();
	},
);

type ZoomEventHandlers = {
	category: {
		event: (c: Context<ZoomWebhookEnv>) => Promise<void>;
	};
	session: Partial<{
		[K in ZoomSessionKeys]: (
			c: Context<ZoomWebhookEnv<ZoomSessions[K]>>,
		) => Promise<void>;
	}>;
};

export function zoomEvents(
	handlers: Partial<ZoomEventHandlers>,
	hooks?: {
		before?: (c: Context<ZoomWebhookEnv>) => Promise<void>;
		after?: (c: Context<ZoomWebhookEnv>) => Promise<void>;
	},
) {
	return async (c: Context<ZoomWebhookEnv>) => {
		const category = c.get("category");
		const event = c.get("event");

		if (hooks?.before) await tryAPI("hook-before", hooks.before(c));

		try {
			const getCategory = handlers[category as "category"];

			if (!getCategory)
				throw new Error(
					`Category of handler is missing for [ ${category}:${event} ]`,
				);

			const handler = getCategory[event as "event"];

			if (!handler)
				throw new Error(
					`Event handler is missing for [ ${category}:${event} ]`,
				);

			await handler(c);
		} catch (e) {
			console.error(e);
		} finally {
			if (hooks?.after) await tryAPI("hook-after", hooks.after(c));
		}

		return c.json({ message: "Authorized request." }, 200);
	};
}
