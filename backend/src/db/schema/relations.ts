import { defineRelations } from "drizzle-orm";
import * as schema from "./index";

const relations = defineRelations(schema, (r) => ({
	scheduler: {
		teachers: r.many.teacher(),
		students: r.many.student(),
		slots: r.many.slot(),
	},
	teacher: {
		students: r.many.student(),
		slots: r.many.slot(),

		scheduler: r.one.scheduler({
			from: r.teacher.schedulerId,
			to: r.scheduler.id,
		}),
	},
	student: {
		slots: r.many.slot(),

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
}));

export const getRelations = () => ({
	relations: { ...relations, ...schema.authRelations },
});
