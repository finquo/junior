import { protectedProcedure, publicProcedure } from "../procedure";

export const appRouter = {
	health: publicProcedure.route({ method: "GET" }).handler(() => "OK"),
	private: protectedProcedure
		.route({ method: "GET" })
		.handler(({ context }) => context.user),
};
