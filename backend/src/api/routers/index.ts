import { protectedProcedure, publicProcedure } from "../procedure";
import { schedulerRouter as scheduler } from "./scheduler";
import { sidebarRouter as sidebar } from "./sidebar";
import { teacherRouter as teacher } from "./teacher";

export const appRouter = {
	health: publicProcedure.route({ method: "GET" }).handler(() => "OK"),
	private: protectedProcedure
		.route({ method: "GET" })
		.handler(({ context }) => context.user),
	sidebar,
	scheduler,
	teacher,
};
