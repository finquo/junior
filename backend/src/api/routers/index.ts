import { protectedProcedure, publicProcedure } from "../procedure";
import { adminRouter as admin } from "./admin";
import { enrollmentRouter as enrollment } from "./enrollment";
import { schedulerRouter as scheduler } from "./scheduler";
import { sidebarRouter as sidebar } from "./sidebar";
import { studentRouter as student } from "./student";
import { teacherRouter as teacher } from "./teacher";

export const appRouter = {
	health: publicProcedure.route({ method: "GET" }).handler(() => "OK"),
	private: protectedProcedure
		.route({ method: "GET" })
		.handler(({ context }) => context.user),
	sidebar,
	admin,
	scheduler,
	teacher,
	student,
	enrollment,
};
