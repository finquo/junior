import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { trys } from "utils";
import type { ZoomEvents } from "./event";
import { hmacSha256Hex, timingSafeEqual } from "./jwt";

interface Payload {
	event: string;
	event_ts?: number;
	payload?: {
		plainToken?: string;
		account_id?: string;
		object?: Record<string, unknown>;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

type ZoomWebhookEnv = {
	Variables: {
		zoomWebhook: Payload;
		category: string;
		event: string;
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

		const hashForVerify = await hmacSha256Hex(
			secret,
			`v0:${timestamp}:${rawBody}`,
		);

		if (!timingSafeEqual(signature, `v0=${hashForVerify}`))
			return c.json({ message: "Unauthorized request." }, 401);

		const { data: body, error } = trys<Payload>(() => JSON.parse(rawBody));

		if (error) return c.json({ message: "Invalid JSON payload." }, 400);

		if (body.event === "endpoint.url_validation") {
			const plainToken = body.payload?.plainToken ?? "";

			return c.json(
				{
					plainToken,
					encryptedToken: await hmacSha256Hex(secret, plainToken),
				},
				200,
			);
		}

		c.set("zoomWebhook", body);
		const [category, event] = body.event.split(".");

		if (!category || !event)
			return c.json({ message: "Invalid webhook event." }, 400);

		c.set("category", category);
		c.set("event", event);

		await next();
	},
);

export function zoomEvents(
	handlers: Record<
		keyof ZoomEvents,
		Partial<
			Record<
				ZoomEvents[keyof ZoomEvents],
				(c: Context<ZoomWebhookEnv>) => Response | Promise<Response>
			>
		>
	>,
) {
	return (c: Context<ZoomWebhookEnv>) => {
		const category = c.get("category");
		const event = c.get("event");

		const handler = handlers[category as "session"][event as "alert"];

		if (!handler) {
			console.error("Event handler is missing for", "[", category, event, "]");
			return c.json({ message: "Authorized request." }, 200);
		}

		return handler(c);
	};
}
