import {
	schedulerProcedure,
	studentProcedure,
	teacherProcedure,
} from "@/api/procedure";

export const selfRouter = {
	scheduler: schedulerProcedure.handler(async ({ context }) => {
		return context.data;
	}),
	teacher: teacherProcedure.handler(async ({ context }) => {
		return context.data;
	}),
	student: studentProcedure.handler(async ({ context }) => {
		return context.data;
	}),
};
