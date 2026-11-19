import {
	CreateScheduleCommand,
	DeleteScheduleCommand,
	SchedulerClient,
	UpdateScheduleCommand,
} from "@aws-sdk/client-scheduler";
import {
	AWS_REGION,
	EVENT_FUNCTION_ARN,
	EVENT_SCHEDULER_ROLE_ARN,
} from "@/aws/config";
import { NotificationTemplate } from "@/chat/template/notification";
import { db } from "@/services";
import { appOrigin } from "@/utils/app-url";

export const REMINDER_LEAD_MS = 30 * 60_000;
export const SHORT_REMINDER_LEAD_MS = 10 * 60_000;

const getName = (slotId: string) => `slot-reminder-${slotId}`;

export type SlotReminderEvent = {
	type: "slot-reminder";
	slotId: string;
};

const scheduler = new SchedulerClient({ region: AWS_REGION });

export const createSlotReminder = async (slotId: string, startTime: Date) => {
	const timeUntilStart = startTime.getTime() - Date.now();

	// The creation notification already went out; a 10-minute reminder would be in the past.
	if (timeUntilStart < SHORT_REMINDER_LEAD_MS) return;

	const leadMs =
		timeUntilStart < REMINDER_LEAD_MS
			? SHORT_REMINDER_LEAD_MS
			: REMINDER_LEAD_MS;

	const fireAt = new Date(startTime.getTime() - leadMs);

	await scheduler.send(
		new CreateScheduleCommand({
			Name: getName(slotId),
			ScheduleExpression: `at(${fireAt.toISOString().slice(0, 19)})`,
			FlexibleTimeWindow: { Mode: "OFF" },
			Target: {
				Arn: EVENT_FUNCTION_ARN,
				RoleArn: EVENT_SCHEDULER_ROLE_ARN,
				Input: JSON.stringify({
					type: "slot-reminder",
					slotId,
				} satisfies SlotReminderEvent),
			},
		}),
	);
};

export const updateSlotReminder = async (slotId: string, startTime: Date) => {
	const timeUntilStart = startTime.getTime() - Date.now();

	// The creation notification already went out; a 10-minute reminder would be in the past.
	if (timeUntilStart < SHORT_REMINDER_LEAD_MS) return;

	const leadMs =
		timeUntilStart < REMINDER_LEAD_MS
			? SHORT_REMINDER_LEAD_MS
			: REMINDER_LEAD_MS;
	const fireAt = new Date(startTime.getTime() - leadMs);

	await scheduler.send(
		new UpdateScheduleCommand({
			Name: getName(slotId),
			ScheduleExpression: `at(${fireAt.toISOString().slice(0, 19)})`,
			FlexibleTimeWindow: { Mode: "OFF" },
			Target: {
				Arn: EVENT_FUNCTION_ARN,
				RoleArn: EVENT_SCHEDULER_ROLE_ARN,
				Input: JSON.stringify({
					type: "slot-reminder",
					slotId,
				} satisfies SlotReminderEvent),
			},
		}),
	);
};

export const deleteSlotReminder = async (slotId: string) => {
	await scheduler.send(new DeleteScheduleCommand({ Name: getName(slotId) }));
};

export const handleSlotReminder = async (event: SlotReminderEvent) => {
	const slot = await db.query.slot.findFirst({
		where: { id: event.slotId },
		with: {
			lesson: true,
			teacher: { with: { user: true } },
			student: { with: { user: true } },
			scheduler: { with: { user: true } },
		},
	});

	if (!slot) {
		console.error("[event-slot-reminder] slot not found", event.slotId);
		return;
	}

	const joinLink = appOrigin("https://localhost", `/call/${slot.id}`);

	const when = slot.startTime.toLocaleString("en-IN", {
		dateStyle: "medium",
		timeStyle: "short",
		timeZone: "Asia/Kolkata",
	});

	const targets = [
		{
			name: slot.student?.user?.name,
			phoneNumber: slot.student?.user?.phoneNumber,
		},
		{
			name: slot.teacher?.user?.name,
			phoneNumber: slot.teacher?.user?.phoneNumber,
		},
		{
			name: slot.scheduler?.user?.name,
			phoneNumber: slot.scheduler?.user?.phoneNumber,
		},
	];

	await Promise.allSettled(
		targets.map(async ({ name, phoneNumber }) => {
			const number = phoneNumber?.replace(/\D/g, "");
			if (!number) return;

			try {
				await NotificationTemplate(
					number,
					"Class reminder",
					`Hi ${name ?? "there"}, your ${slot.lesson?.name ?? "class"} at ${when} (IST) is starting soon. Join: ${joinLink}`,
				);
			} catch (error) {
				console.error("[event-slot-reminder]", number, error);
			}
		}),
	);
};
