import { NotificationTemplate } from "./template/notification";

type SlotNotification = {
	startTime: Date;
	lessonName: string;
	joinLink: string;
	student?: { name: string; phoneNumber: string | null };
	teacher?: { name: string; phoneNumber: string | null };
	scheduler?: { name: string; phoneNumber: string | null };
};

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

const sendAll = async (
	targets: {
		number: string | null | undefined;
		title: string;
		message: string;
	}[],
) => {
	await Promise.allSettled(
		targets.map(async (target) => {
			const number = target.number?.replace(/\D/g, "");
			if (!number) return;

			try {
				await NotificationTemplate(number, target.title, target.message);
			} catch (error) {
				console.error("[notify-slot]", target.title, error);
			}
		}),
	);
};

export const notifySlotCreated = async ({
	startTime,
	lessonName,
	joinLink,
	student,
	teacher,
	scheduler,
}: SlotNotification) => {
	const when = formatSlotTime(startTime);
	const studentName = student?.name ?? "the student";
	const teacherName = teacher?.name ?? "the teacher";

	await sendAll([
		{
			number: student?.phoneNumber,
			title: "Class scheduled",
			message: `${lessonName} with ${teacherName} on ${when} (IST). Join: ${joinLink}`,
		},
		{
			number: teacher?.phoneNumber,
			title: "New class scheduled",
			message: `${lessonName} with ${studentName} on ${when} (IST). Join: ${joinLink}`,
		},
		{
			number: scheduler?.phoneNumber,
			title: "Class scheduled",
			message: `${lessonName}: ${studentName} with ${teacherName} on ${when} (IST). Join: ${joinLink}`,
		},
	]);
};

export const notifyStudentReport = async ({
	name,
	phoneNumber,
	link,
}: {
	name: string;
	phoneNumber: string;
	link: string;
}) => {
	await sendAll([
		{
			number: phoneNumber,
			title: "Performance report",
			message: `Hi ${name}, view your performance report anytime: ${link}`,
		},
	]);
};

export const notifySlotSummary = async ({
	name,
	phoneNumber,
	link,
}: {
	name: string;
	phoneNumber: string;
	link: string;
}) => {
	await sendAll([
		{
			number: phoneNumber,
			title: "Session summary",
			message: `Hi ${name}, view the session summary anytime: ${link}`,
		},
	]);
};

export const notifySlotUpdated = async ({
	startTime,
	lessonName,
	joinLink,
	student,
	teacher,
	scheduler,
}: SlotNotification) => {
	const when = formatSlotTime(startTime);
	const studentName = student?.name ?? "the student";
	const teacherName = teacher?.name ?? "the teacher";

	await sendAll([
		{
			number: student?.phoneNumber,
			title: "Class rescheduled",
			message: `${lessonName} with ${teacherName} rescheduled to ${when} (IST). Join: ${joinLink}`,
		},
		{
			number: teacher?.phoneNumber,
			title: "Class rescheduled",
			message: `${lessonName} with ${studentName} on ${when} (IST). Join: ${joinLink}`,
		},
		{
			number: scheduler?.phoneNumber,
			title: "Class rescheduled",
			message: `${lessonName}: ${studentName} with ${teacherName} on ${when} (IST). Join: ${joinLink}`,
		},
	]);
};
