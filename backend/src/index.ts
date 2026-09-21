import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError, ValidationError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import z from "zod";
import { appRouter } from "@/api/routers";
import { createContext } from "./api/context";
import { ENV } from "./env.server";
import { auth } from "./services";

const app = new Hono({ strict: false }).basePath("/api");

app.use(logger());
app.use(
	"/*",
	cors({
		origin: ENV.CORS_ORIGIN,
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
					status: 422,
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

app.use("/reference/*", async (c, next) => {
	const openAPIHandler = new OpenAPIHandler(appRouter, {
		plugins: [
			new OpenAPIReferencePlugin({
				schemaConverters: [new ZodToJsonSchemaConverter()],
			}),
		],
		interceptors: [
			onError((error) => {
				console.error(error);
			}),
		],
	});

	const { matched, response } = await openAPIHandler.handle(c.req.raw, {
		prefix: "/api/reference",
		context: await createContext(c),
	});

	if (matched) return c.newResponse(response.body, response);

	await next();
});

export default app;
