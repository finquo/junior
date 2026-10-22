import { whatsappAdapter } from "../whatsapp";
import { bodyComponent } from "./components";

export const NotificationTemplate = async (
	number: string,
	title: string,
	message: string,
) => {
	const threadId = await whatsappAdapter.openDM(number);

	await whatsappAdapter.sendTemplate(threadId, {
		name: "finquo_notification",
		language: "en",
		components: [bodyComponent([title, message])],
	});
};

export const NotificationTemplateSingleParameter = async (
	number: string,
	title: string,
	message: string,
) => {
	const threadId = await whatsappAdapter.openDM(number);

	await whatsappAdapter.sendTemplate(threadId, {
		name: "finquo_notification",
		language: "en",
		components: [bodyComponent([`${title}: ${message}`])],
	});
};
