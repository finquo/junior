import type { Role } from "@/auth";
import type { SchedulerType, StudentType, TeacherType } from "@/config";
import { db } from "@/services";
import { getError, protectedProcedure, tryAPI } from "./procedure";

type Data = {
	student: StudentType
	teacher: TeacherType
	scheduler: SchedulerType
}

export const fetchExtraData = async (role: Role, id: string) => {
	if (role === "student")
		return await tryAPI<StudentType | undefined>(
			"procedure-fetch-student-data",
			db.query.student.findFirst({
				where: { id }
			}))

	if (role === "teacher")
		return await tryAPI<TeacherType | undefined>(
			"procedure-fetch-teacher-data",
			db.query.teacher.findFirst({
				where: { id }
			}))

	if (role === "scheduler")
		return await tryAPI<SchedulerType | undefined>(
			"procedure-fetch-scheduler-data",
			db.query.scheduler.findFirst({
				where: { id }
			}))

	return;
}

type GetKey<D, R> = R extends keyof D ? D[R] : undefined;

export const getProcedure = <R extends Role>(role: R) =>
	protectedProcedure.use(async ({ context, next }) => {
		if (context.user.role !== role)
			throw getError(
				"UNAUTHORIZED",
				"You are not authorized to access this action",
			);

		if (context.session.impersonatedBy)
			console.log("impersonatedBy:", context.session.impersonatedBy);

		const data = await fetchExtraData(role, context.user.id);

		return next({
			context: {
				...context,
				data: data as GetKey<Data, R> | undefined
			}
		});
	});
