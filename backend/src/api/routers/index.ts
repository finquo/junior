import { protectedProcedure, publicProcedure } from "../procedure";
import { sidebarRouter as sidebar } from "./sidebar";

export const appRouter = {
	health: publicProcedure.route({ method: "GET" }).handler(() => "OK"),
	private: protectedProcedure
		.route({ method: "GET" })
		.handler(({ context }) => context.user),
	sidebar,
};
