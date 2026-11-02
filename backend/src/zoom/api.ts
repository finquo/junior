import { createFetch, createSchema } from "@better-fetch/fetch";
import z from "zod";

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
	},
	{ strict: true },
);

export const zoomAPI = createFetch({
	baseURL: `https://api.zoom.us/v2/accounts/${process.env.ZOOM_API_ID}/videosdk`,
	headers: {
		"x-api-key": process.env.ZOOM_API_KEY,
	},
	schema: zoomAPISchema,
});
