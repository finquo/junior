import type { Context as HonoContext } from "hono";

export async function createContext(context: HonoContext) {
	return {
		req: context.req.raw,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
