import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError, ValidationError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { RPC_DEFAULT_ALLOW_METHODS } from "@orpc/server/standard";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import z from "zod";
import { appRouter } from "@/api/routers";
import { createContext } from "./api/context";
import { auth } from "./services";

const app = new Hono({ strict: false }).basePath("/api");

app.use(logger());
app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN,
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		credentials: true,
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

app.on(["POST", "GET"], "/auth/*", async (c) => {
	return auth.handler(c.req.raw);
});

const handler = new RPCHandler(appRouter, {
	allowMethods: ["GET", ...RPC_DEFAULT_ALLOW_METHODS],
	interceptors: [
		onError((error) => {
			if (
				error instanceof ORPCError &&
				error.cause instanceof ValidationError &&
				error.code === "BAD_REQUEST"
			) {
				const zodError = new z.ZodError(
					error.cause.issues as z.core.$ZodIssue[],
				);

				throw new ORPCError("INPUT_VALIDATION_FAILED", {
					message: zodError.issues.map((i) => i.message).join("\n"),
					data: z.flattenError(zodError),
					cause: error.cause,
				});
			}

			console.error(error);
		}),
	],
});

app.use("/*", async (c, next) => {
	const { matched, response } = await handler.handle(c.req.raw, {
		prefix: "/api",
		context: await createContext(c),
	});

	if (matched) return c.newResponse(response.body, response);

	await next();
});

app.use("/openapi/*", async (c, next) => {
	const generator = new OpenAPIGenerator({
		converters: [new ZodToJsonSchemaConverter()],
	});

	const handler = new OpenAPIHandler(appRouter, {
		plugins: [
			new OpenAPIReferenceHandlerPlugin({
				spec: () =>
					generator.generate(appRouter, {
						base: {
							info: {
								title: "Finquo App OpenAPI",
								version: "1.0.0",
							},
							servers: [
								{
									name: "Current",
									url: c.req.url.replace("/openapi", ""),
								},
								{
									name: "Cloudflare",
									url: "https://junior.finquo.workers.dev/api",
								},
								{
									name: "Vercel",
									url: "https://finquo-junior.vercel.app/api",
								},
							],
						},
					}),
			}),
		],
	});

	const { matched, response } = await handler.handle(c.req.raw, {
		prefix: "/api/openapi",
		context: await createContext(c),
	});

	if (matched) return c.newResponse(response.body, response);

	await next();
});

export default app;
