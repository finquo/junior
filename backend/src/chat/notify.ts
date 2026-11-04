import { db } from "@/services";
import { NotificationTemplate } from "./template/notification";

const formatSlotTime = (date: Date) =>
	new Intl.DateTimeFormat("en-IN", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
		timeZone: "Asia/Kolkata",
	}).format(date);

export const notifySlotCreated = async (slotId: string, appUrl: string) => {
	const slot = await db.query.slot.findFirst({
		where: { id: slotId },
		columns: { startTime: true },
		with: {
			lesson: { columns: { name: true } },
			student: {
				with: { user: { columns: { name: true, phoneNumber: true } } },
			},
			teacher: {
				with: { user: { columns: { name: true, phoneNumber: true } } },
			},
			scheduler: {
				with: { user: { columns: { name: true, phoneNumber: true } } },
			},
		},
	});

	if (!slot) return;

	const when = formatSlotTime(slot.startTime);
	const lessonName = slot.lesson?.name ?? "a class";
	const studentName = slot.student?.user?.name ?? "the student";
	const teacherName = slot.teacher?.user?.name ?? "the teacher";
	const joinLink = `${appUrl.replace(/\/+$/, "")}/call/${slotId}`;

	const targets = [
		{
			number: slot.student?.user?.phoneNumber,
			title: "Class scheduled",
			message: `${lessonName} with ${teacherName} on ${when} (IST). Join: ${joinLink}`,
		},
		{
			number: slot.teacher?.user?.phoneNumber,
			title: "New class scheduled",
			message: `${lessonName} with ${studentName} on ${when} (IST). Join: ${joinLink}`,
		},
		{
			number: slot.scheduler?.user?.phoneNumber,
			title: "Class scheduled",
			message: `${lessonName}: ${studentName} with ${teacherName} on ${when} (IST). Join: ${joinLink}`,
		},
	];

	await Promise.allSettled(
		targets.map(async (target) => {
			const number = target.number?.replace(/\D/g, "");
			if (!number) return;

			try {
				await NotificationTemplate(number, target.title, target.message);
			} catch (error) {
				console.error("[notify-slot-created]", target.title, error);
			}
		}),
	);
};
