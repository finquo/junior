import { defineRelations } from "drizzle-orm";
import * as schema from "./index";

const relations = defineRelations(schema, (r) => ({
	user: {
		teacherData: r.one.teacher({
			from: r.user.id,
			to: r.teacher.id,
		}),
		studentData: r.one.student({
			from: r.user.id,
			to: r.student.id,
		}),
		schedulerData: r.one.scheduler({
			from: r.user.id,
			to: r.scheduler.id,
		}),
	},
	scheduler: {
		user: r.one.user({
			from: r.scheduler.id,
			to: r.user.id,
		}),
		teachers: r.many.teacher(),
		students: r.many.student(),
		slots: r.many.slot(),
	},
	teacher: {
		user: r.one.user({
			from: r.teacher.id,
			to: r.user.id,
		}),
		students: r.many.student(),
		slots: r.many.slot(),

		scheduler: r.one.scheduler({
			from: r.teacher.supervisorId,
			to: r.scheduler.id,
		}),
	},
	student: {
		user: r.one.user({
			from: r.student.id,
			to: r.user.id,
		}),

		slots: r.many.slot(),
		payments: r.many.payment({
			from: r.student.id,
			to: r.payment.studentId,
		}),
		materials: r.many.material({
			from: r.student.id,
			to: r.material.studentId,
		}),

		mentor: r.one.teacher({
			from: r.student.mentorId,
			to: r.teacher.id,
		}),
		scheduler: r.one.scheduler({
			from: r.student.supervisorId,
			to: r.scheduler.id,
		}),
		programInfo: r.one.program({
			from: r.student.program,
			to: r.program.id,
		}),
	},
	slot: {
		lesson: r.one.lesson({
			from: r.slot.lessonId,
			to: r.lesson.id,
		}),
		teacher: r.one.teacher({
			from: r.slot.teacherId,
			to: r.teacher.id,
		}),
		student: r.one.student({
			from: r.slot.studentId,
			to: r.student.id,
		}),
		scheduler: r.one.scheduler({
			from: r.slot.schedulerId,
			to: r.scheduler.id,
		}),
	},
	answer: {
		quiz: r.one.lesson({
			from: r.answer.lessonId,
			to: r.lesson.id,
		}),
		author: r.one.student({
			from: r.answer.studentId,
			to: r.student.id,
		}),
	},
	lesson: {
		slots: r.many.slot(),
		answers: r.many.answer(),
		programInfo: r.one.program({
			from: r.lesson.program,
			to: r.program.id,
		}),
	},
	program: {
		lessonList: r.many.lesson({
			from: r.program.id,
			to: r.lesson.program,
		}),
	},
}));

export const getRelations = {
	...relations,
	...schema.authRelations,
	user: {
		name: "user",
		table: schema.user,
		relations: {
			...schema.authRelations.user.relations,
			...relations.user.relations,
		},
	},
};
