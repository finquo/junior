import { createPostgresState } from "@chat-adapter/state-pg";
import { createWhatsAppAdapter } from "@chat-adapter/whatsapp";
import { Chat } from "chat";

export const whatsappAdapter = createWhatsAppAdapter({
	phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
	appSecret: process.env.WHATSAPP_APP_SECRET,
	accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
	verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
});

export const bot = new Chat({
	userName: "Finquo Junior Info",
	adapters: {
		whatsapp: whatsappAdapter,
	},
	state: createPostgresState({
		autoCreateSchema: false,
		url: process.env.DATABASE_URL,
	}),
});

export const whatappHandler = bot.webhooks.whatsapp;
