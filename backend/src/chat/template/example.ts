import { whatsappAdapter } from "../whatsapp";

export const ExampleTemplate = async (number: string, text: string) => {
	const threadId = await whatsappAdapter.openDM(number);

	await whatsappAdapter.sendTemplate(threadId, {
		name: "example",
		language: "en",
		components: [
			{
				type: "body",
				parameters: [{ type: "text", text }],
			},
		],
	});
};
