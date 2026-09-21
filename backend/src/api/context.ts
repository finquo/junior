import type { Context as HonoContext } from "hono";
import { auth, db } from "../services";

export async function createContext(context: HonoContext) {
	return {
		db,
		auth,
		req: context.req.raw,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
