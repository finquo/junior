import z from "zod";
import { getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { NotificationTemplate } from "@/chat/template/notification";
import { db } from "@/services";

export const chatRouter = {
	alertStudent: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const slot = await tryAPI(
				"db-core-alert-slot-student",
				db.query.slot.findFirst({
					where: { id: input.id },
					with: {
						lesson: true,
						student: { with: { user: true } },
						teacher: { with: { user: true } },
					},
				}),
			);

			if (!slot) throw getError("NOT_FOUND", "Slot not found");

			if (context.role === "scheduler" && slot.schedulerId !== context.user.id)
				throw getError(
					"FORBIDDEN",
					"You are not authorized to alert this slot",
				);

			if (!slot.lesson)
				throw getError("PRECONDITION_FAILED", "Slot has no lesson attached");

			if (!slot.student)
				throw getError("PRECONDITION_FAILED", "Slot has no student attached");

			if (!slot.student.user)
				throw getError(
					"PRECONDITION_FAILED",
					"Slot student has no user attached",
				);

			if (!slot.teacher)
				throw getError("PRECONDITION_FAILED", "Slot has no teacher attached");

			if (!slot.teacher.user)
				throw getError(
					"PRECONDITION_FAILED",
					"Slot teacher has no user attached",
				);

			if (!slot.student.user.phoneNumber)
				throw getError("PRECONDITION_FAILED", "Student has no phone number");

			const number = slot.student.user.phoneNumber.replace(/\D/g, "");

			if (!number)
				throw getError(
					"PRECONDITION_FAILED",
					"Student has an invalid phone number",
				);

			const startTime = new Intl.DateTimeFormat("en-IN", {
				dateStyle: "medium",
				timeStyle: "short",
				timeZone: "Asia/Kolkata",
			}).format(slot.startTime);

			try {
				await NotificationTemplate(
					number,
					"Class scheduled",
					`${slot.lesson.name} with ${slot.teacher.user.name} starts ${startTime}.`,
				);
				return true;
			} catch (error) {
				console.error("[core-alert-slot-student]", error);
				return false;
			}
		}),
	alertTeacher: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const slot = await tryAPI(
				"db-core-alert-slot-teacher",
				db.query.slot.findFirst({
					where: { id: input.id },
					with: {
						lesson: true,
						student: { with: { user: true } },
						teacher: { with: { user: true } },
					},
				}),
			);

			if (!slot) throw getError("NOT_FOUND", "Slot not found");

			if (context.role === "scheduler" && slot.schedulerId !== context.user.id)
				throw getError(
					"FORBIDDEN",
					"You are not authorized to alert this slot",
				);

			if (!slot.lesson)
				throw getError("PRECONDITION_FAILED", "Slot has no lesson attached");

			if (!slot.student)
				throw getError("PRECONDITION_FAILED", "Slot has no student attached");

			if (!slot.student.user)
				throw getError(
					"PRECONDITION_FAILED",
					"Slot student has no user attached",
				);

			if (!slot.teacher)
				throw getError("PRECONDITION_FAILED", "Slot has no teacher attached");

			if (!slot.teacher.user)
				throw getError(
					"PRECONDITION_FAILED",
					"Slot teacher has no user attached",
				);

			if (!slot.teacher.user.phoneNumber)
				throw getError("PRECONDITION_FAILED", "Teacher has no phone number");

			const number = slot.teacher.user.phoneNumber.replace(/\D/g, "");

			if (!number)
				throw getError(
					"PRECONDITION_FAILED",
					"Teacher has an invalid phone number",
				);

			const startTime = new Intl.DateTimeFormat("en-IN", {
				dateStyle: "medium",
				timeStyle: "short",
				timeZone: "Asia/Kolkata",
			}).format(slot.startTime);

			try {
				await NotificationTemplate(
					number,
					"New class scheduled",
					`${slot.lesson.name} with ${slot.student.user.name} starts ${startTime}.`,
				);
				return true;
			} catch (error) {
				console.error("[core-alert-slot-teacher]", error);
				return false;
			}
		}),
	alertScheduler: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const slot = await tryAPI(
				"db-core-alert-slot-scheduler",
				db.query.slot.findFirst({
					where: { id: input.id },
					with: {
						lesson: true,
						student: { with: { user: true } },
						teacher: { with: { user: true } },
						scheduler: { with: { user: true } },
					},
				}),
			);

			if (!slot) throw getError("NOT_FOUND", "Slot not found");

			if (context.role === "scheduler" && slot.schedulerId !== context.user.id)
				throw getError(
					"FORBIDDEN",
					"You are not authorized to alert this slot",
				);

			if (!slot.lesson)
				throw getError("PRECONDITION_FAILED", "Slot has no lesson attached");

			if (!slot.student)
				throw getError("PRECONDITION_FAILED", "Slot has no student attached");

			if (!slot.student.user)
				throw getError(
					"PRECONDITION_FAILED",
					"Slot student has no user attached",
				);

			if (!slot.teacher)
				throw getError("PRECONDITION_FAILED", "Slot has no teacher attached");

			if (!slot.teacher.user)
				throw getError(
					"PRECONDITION_FAILED",
					"Slot teacher has no user attached",
				);

			if (!slot.scheduler)
				throw getError("PRECONDITION_FAILED", "Slot has no scheduler attached");

			if (!slot.scheduler.user)
				throw getError(
					"PRECONDITION_FAILED",
					"Slot scheduler has no user attached",
				);

			if (!slot.scheduler.user.phoneNumber)
				throw getError("PRECONDITION_FAILED", "Scheduler has no phone number");

			const number = slot.scheduler.user.phoneNumber.replace(/\D/g, "");

			if (!number)
				throw getError(
					"PRECONDITION_FAILED",
					"Scheduler has an invalid phone number",
				);

			const startTime = new Intl.DateTimeFormat("en-IN", {
				dateStyle: "medium",
				timeStyle: "short",
				timeZone: "Asia/Kolkata",
			}).format(slot.startTime);

			try {
				await NotificationTemplate(
					number,
					"Class scheduled",
					`${slot.lesson.name}: ${slot.student.user.name} with ${slot.teacher.user.name} starts ${startTime}.`,
				);
				return true;
			} catch (error) {
				console.error("[core-alert-slot-scheduler]", error);
				return false;
			}
		}),
};
