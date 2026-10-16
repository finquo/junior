import { getAPI, getRolesProcedure, publicProcedure } from "@/api/procedure";
import { db } from "@/services";
import { MapRole } from "@/utils/role";

export const sidebarRouter = {
	example: publicProcedure.handler(() => [
		{
			title: "Title",
			id: "1234567890",
		},
	]),
	schedulers: getRolesProcedure(["admin"]).handler(async ({ context }) => {
		const data = await getAPI(
			"db-sidebar-get-schedulers-query",
			db.query.scheduler.findMany({
				where: MapRole(context.role, {
					admin: {},
				}),
				orderBy: { createdAt: "desc" },
				limit: 5,
				with: {
					user: true,
				},
			}),
			[],
		);

		return data.map((item) => ({
			id: item.id,
			title: item.user?.name ?? item.id,
		}));
	}),
	teachers: getRolesProcedure(["admin", "scheduler"]).handler(
		async ({ context }) => {
			const data = await getAPI(
				"db-sidebar-get-teachers-query",
				db.query.teacher.findMany({
					where: MapRole(context.role, {
						admin: {},
						scheduler: {
							supervisorId: context.user.id,
						},
					}),
					orderBy: { createdAt: "desc" },
					limit: 5,
					with: {
						user: true,
					},
				}),
				[],
			);

			return data.map((item) => ({
				id: item.id,
				title: item.user?.name ?? item.id,
			}));
		},
	),
	students: getRolesProcedure(["admin", "scheduler", "teacher"]).handler(
		async ({ context }) => {
			const data = await getAPI(
				"db-sidebar-get-students-query",
				db.query.student.findMany({
					where: MapRole(context.role, {
						admin: {},
						scheduler: {
							supervisorId: context.user.id,
						},
						teacher: {
							mentorId: context.user.id,
						},
					}),
					orderBy: { createdAt: "desc" },
					limit: 5,
					with: {
						user: true,
					},
				}),
				[],
			);

			return data.map((item) => ({
				id: item.id,
				title: item.user?.name ?? item.id,
			}));
		},
	),
	slots: getRolesProcedure(["admin", "scheduler", "teacher"]).handler(
		async ({ context }) => {
			const data = await getAPI(
				"db-sidebar-get-slots-query",
				db.query.slot.findMany({
					where: MapRole(context.role, {
						admin: {},
						scheduler: {
							schedulerId: context.user.id,
						},
						teacher: {
							teacherId: context.user.id,
						},
					}),
					orderBy: {
						startTime: "desc",
					},
					limit: 5,
					with: {
						teacher: { with: { user: true } },
						student: { with: { user: true } },
						lesson: true,
					},
				}),
				[],
			);

			return data.map((item) => ({
				id: item.id,
				title: item.lesson?.name
					? `${item.lesson.name} (${item.student?.user?.name ?? "Student"})`
					: (item.student?.user?.name ?? "Slot"),
			}));
		},
	),
	programs: getRolesProcedure(["admin", "scheduler", "teacher"]).handler(
		async () => {
			const data = await getAPI(
				"db-sidebar-get-programs-query",
				db.query.program.findMany({
					orderBy: { name: "asc" },
				}),
				[],
			);

			return data.map((program) => ({
				id: program.id,
				title: program.name,
			}));
		},
	),
};
