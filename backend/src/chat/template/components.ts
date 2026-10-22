import type { WhatsAppTemplateComponent } from "@chat-adapter/whatsapp";

export const sanitizeTemplateParameter = (text: string): string => {
	const flattened = String(text ?? "")
		.replace(/\s+/g, " ")
		.trim();
	return (flattened.length > 0 ? flattened : "-").slice(0, 1024);
};

export const sanitizeFileName = (name: string): string => {
	const cleaned = String(name ?? "")
		.replace(/[\r\n"\\]/g, "")
		.replace(/[^\w.\- ]+/g, "_")
		.replace(/\s+/g, " ")
		.trim();
	return cleaned.length > 0 ? cleaned.slice(0, 120) : "report.pdf";
};

export const bodyComponent = (values: string[]): WhatsAppTemplateComponent => ({
	type: "body",
	parameters: values.map((text) => ({
		type: "text",
		text: sanitizeTemplateParameter(text),
	})),
});

/** DOCUMENT header component — the PDF rides along with the template message. */
export const documentHeaderComponent = (document: {
	mediaId?: string;
	link?: string;
	fileName: string;
}): WhatsAppTemplateComponent => {
	if (!document.mediaId && !document.link) {
		throw new Error("documentHeaderComponent: provide a mediaId or a link");
	}

	return {
		type: "header",
		parameters: [
			{
				type: "document",
				document: {
					...(document.mediaId
						? { id: document.mediaId }
						: { link: document.link }),
					filename: sanitizeFileName(document.fileName),
				},
			},
		],
	};
};
