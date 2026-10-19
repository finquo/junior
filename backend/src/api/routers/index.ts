import { openapi } from "@orpc/openapi";
import { protectedProcedure, publicProcedure } from "../procedure";
import { adminRouter as admin } from "./admin";
import { commonRouter as common } from "./common";
import { lessonRouter as lessonCore } from "./core/lesson";
import { programRouter as programCore } from "./core/program";
import { schedulerRouter as schedulerCore } from "./core/scheduler";
import { selfRouter as selfCore } from "./core/self";
import { slotRouter as slotCore } from "./core/slot";
import { studentRouter as studentCore } from "./core/student";
import { teacherRouter as teacherCore } from "./core/teacher";
import { userRouter as userCore } from "./core/user";
import { meetingRouter as meeting } from "./meeting";
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
	meeting,
	core: {
		lesson: lessonCore,
		program: programCore,
		scheduler: schedulerCore,
		self: selfCore,
		slot: slotCore,
		student: studentCore,
		teacher: teacherCore,
		user: userCore,
	},
};
