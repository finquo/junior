import { defineRelations } from "drizzle-orm";
import * as schema from "./index";

const relations = defineRelations(schema, (r) => ({
	scheduler: {
		user: r.one.user({
			from: r.scheduler.userId,
			to: r.user.id,
		}),
		teachers: r.many.teacher(),
		students: r.many.student(),
		slots: r.many.slot(),
		materials: r.many.material(),
	},
	teacher: {
		user: r.one.user({
			from: r.teacher.userId,
			to: r.user.id,
		}),
		students: r.many.student(),
		slots: r.many.slot(),

		scheduler: r.one.scheduler({
			from: r.teacher.schedulerId,
			to: r.scheduler.id,
		}),
	},
	student: {
		user: r.one.user({
			from: r.student.userId,
			to: r.user.id,
		}),

		slots: r.many.slot(),
		payments: r.many.payment(),
		materials: r.many.material(),

		mentor: r.one.teacher({
			from: r.student.mentorId,
			to: r.teacher.id,
		}),
		scheduler: r.one.scheduler({
			from: r.student.schedulerId,
			to: r.scheduler.id,
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
		quiz: r.one.lesson(),
		author: r.one.student(),
	},
	lesson: {
		slots: r.many.slot(),
		answers: r.many.answer(),
		materials: r.many.material(),
	},
}));

export const getRelations = {
	...relations,
	...schema.authRelations,
};
