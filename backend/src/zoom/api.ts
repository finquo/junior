import { createFetch, createSchema } from "@better-fetch/fetch";
import z from "zod";
import { generateZoomAPIToken } from "./jwt";

const sessionId = z
	.string()
	.transform((s) => (s.includes("/") ? encodeURIComponent(s) : s));

const zoomAPISchema = createSchema(
	{
		"/sessions/:sessionId/events": {
			method: "patch",
			input: z.object({
				method: z.enum(["recording.start", "recording.stop"]),
			}),
			params: z.object({
				sessionId,
			}),
		},
		"/sessions/:sessionId/status": {
			method: "put",
			input: z.object({
				action: z.literal("end"),
			}),
			params: z.object({
				sessionId,
			}),
		},
		"@delete/sessions/:sessionId": {
			method: "delete",
			params: z.object({
				sessionId,
			}),
		},
	},
	{ strict: true },
);

export const getZoomAPI = async () => {
	return createFetch({
		baseURL: "https://api.zoom.us/v2/videosdk",
		auth: {
			type: "Bearer",
			token: await generateZoomAPIToken(),
		},
		schema: zoomAPISchema,
	});
};
