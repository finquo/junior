import { openapi } from "@orpc/openapi";
import { protectedProcedure, publicProcedure } from "../procedure";
import { adminRouter as admin } from "./admin";
import { commonRouter as common } from "./common";
import { lessonRouter as lessonCore } from "./core/lesson";
import { studentRouter as studentCore } from "./core/student";
import { teacherRouter as teacherCore } from "./core/teacher";
import { userRouter as userCore } from "./core/user";
import { schedulerRouter as scheduler } from "./scheduler";
import { sidebarRouter as sidebar } from "./sidebar";
import { studentRouter as student } from "./student";
import { teacherRouter as teacher } from "./teacher";

export const appRouter = {
	health: publicProcedure.meta(openapi({ method: "GET" })).handler(() => "OK"),
	private: protectedProcedure
		.meta(openapi({ method: "GET" }))
		.handler(({ context: c }) => c.user),
	sidebar,
	admin,
	scheduler,
	teacher,
	student,
	common,
	core: {
		student: studentCore,
		teacher: teacherCore,
		lesson: lessonCore,
		user: userCore,
	},
};
