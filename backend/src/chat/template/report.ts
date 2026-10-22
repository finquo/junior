import type { WhatsAppTemplateComponent } from "@chat-adapter/whatsapp";
import { whatsappAdapter } from "../whatsapp";
import { bodyComponent, documentHeaderComponent } from "./components";

const REPORT_TEMPLATE_VARIABLES = [
	"studentName",
	"sessionTitle",
	"classDate",
	"mentorName",
] as const;

type ReportTemplateVariables = Record<
	(typeof REPORT_TEMPLATE_VARIABLES)[number],
	string
>;

export const ReportTemplate = async (
	number: string,
	variables: ReportTemplateVariables,
	document?: { mediaId?: string; link?: string; fileName: string },
) => {
	const threadId = await whatsappAdapter.openDM(number);

	const components: WhatsAppTemplateComponent[] = [];
	if (document) {
		components.push(documentHeaderComponent(document));
	}
	components.push(
		bodyComponent(REPORT_TEMPLATE_VARIABLES.map((name) => variables[name])),
	);

	await whatsappAdapter.sendTemplate(threadId, {
		name: "report",
		language: "en",
		components,
	});
};
