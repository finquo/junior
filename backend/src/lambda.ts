import { handleSlotReminder, type SlotReminderEvent } from "./event";
import { handleMediaEvent, type S3Event } from "./event/media";

export const handler = async (event: SlotReminderEvent | S3Event) => {
	if ("Records" in event) {
		return handleMediaEvent(event);
	}

	switch (event.type) {
		case "slot-reminder":
			return handleSlotReminder(event);
		default:
			console.error("[event] unknown event type", event);
	}
};
