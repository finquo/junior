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
		programPayments: r.many.programPayment({
			from: r.student.id,
			to: r.programPayment.studentId,
		}),
		lessonAnswers: r.many.lessonAnwser({
			from: r.student.id,
			to: r.lessonAnwser.studentId,
		}),

		slots: r.many.slot(),
		materials: r.many.material({
			from: r.student.id,
			to: r.material.studentId,
		}),

		courseInfo: r.one.course({
			from: r.student.course,
			to: r.course.id,
		}),
		coursePayments: r.many.coursePayment({
			from: r.student.id,
			to: r.coursePayment.studentId,
		}),
		moduleAnswers: r.many.moduleAnwser({
			from: r.student.id,
			to: r.moduleAnwser.studentId,
		}),
	},
	course: {
		students: r.many.student({
			from: r.course.id,
			to: r.student.course,
		}),
		moduleList: r.many.module({
			from: r.course.id,
			to: r.module.course,
		}),
		videos: r.many.video({
			from: r.course.id,
			to: r.video.course,
		}),
		payments: r.many.coursePayment({
			from: r.course.id,
			to: r.coursePayment.course,
		}),
	},
	module: {
		courseInfo: r.one.course({
			from: r.module.course,
			to: r.course.id,
		}),
		videoList: r.many.video({
			from: r.module.id,
			to: r.video.module,
		}),
		answers: r.many.moduleAnwser({
			from: r.module.id,
			to: r.moduleAnwser.moduleId,
		}),
	},
	video: {
		courseInfo: r.one.course({
			from: r.video.course,
			to: r.course.id,
		}),
		moduleInfo: r.one.module({
			from: r.video.module,
			to: r.module.id,
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
	lessonAnwser: {
		quiz: r.one.lesson({
			from: r.lessonAnwser.lessonId,
			to: r.lesson.id,
		}),
		author: r.one.student({
			from: r.lessonAnwser.studentId,
			to: r.student.id,
		}),
	},
	moduleAnwser: {
		moduleInfo: r.one.module({
			from: r.moduleAnwser.moduleId,
			to: r.module.id,
		}),
		author: r.one.student({
			from: r.moduleAnwser.studentId,
			to: r.student.id,
		}),
	},
	programPayment: {
		student: r.one.student({
			from: r.programPayment.studentId,
			to: r.student.id,
		}),
		programInfo: r.one.program({
			from: r.programPayment.program,
			to: r.program.id,
		}),
	},
	coursePayment: {
		student: r.one.student({
			from: r.coursePayment.studentId,
			to: r.student.id,
		}),
		courseInfo: r.one.course({
			from: r.coursePayment.course,
			to: r.course.id,
		}),
	},
	material: {
		student: r.one.student({
			from: r.material.studentId,
			to: r.student.id,
		}),
		scheduler: r.one.scheduler({
			from: r.material.schedulerId,
			to: r.scheduler.id,
		}),
	},
	feedback: {
		user: r.one.user({
			from: r.feedback.userId,
			to: r.user.id,
		}),
	},
	lesson: {
		slots: r.many.slot(),
		answers: r.many.lessonAnwser({
			from: r.lesson.id,
			to: r.lessonAnwser.lessonId,
		}),
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
		payments: r.many.programPayment({
			from: r.program.id,
			to: r.programPayment.program,
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
