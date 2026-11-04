import { createFetch, createSchema } from "@better-fetch/fetch";
import z from "zod";
import { generateZoomAPIToken } from "./jwt";

const sessionId = z
	.string()
	.transform((s) => (s.includes("/") ? encodeURIComponent(s) : s));

const zoomAPISchema = createSchema(
	{
		"/sessions": {
			method: "get",
			query: z.object({
				type: z.enum(["past", "live"]).optional(),
				from: z.date().transform((d) => d.toISOString().slice(0, 10)),
				to: z
					.date()
					.transform((d) => d.toISOString().slice(0, 10))
					.optional(),
				page_size: z.number().int().optional(),
				next_page_token: z.string().optional(),
				session_key: z.string().optional(),
				session_name: z.string().optional(),
			}),
			output: z.object({
				from: z.string(),
				to: z.string(),
				page_size: z.number(),
				next_page_token: z.string().optional(),
				sessions: z.array(
					z.object({
						id: z.string(),
						session_name: z.string(),
						session_key: z.string(),
						start_time: z.string(),
						end_time: z.string().optional(),
						duration: z.string(),
						user_count: z.number(),
						// audio_quality: z.enum(["good", "fair", "poor", "bad"]),
						// video_quality: z.enum(["good", "fair", "poor", "bad"]),
						// screen_share_quality: z.enum(["good", "fair", "poor", "bad"]),
						has_voip: z.boolean(),
						has_video: z.boolean(),
						has_screen_share: z.boolean(),
						has_recording: z.boolean(),
						has_pstn: z.boolean(),
						has_session_summary: z.boolean(),
					}),
				),
			}),
		},
		"/sessions/:sessionId/users": {
			method: "get",
			params: z.object({
				sessionId,
			}),
			query: z.object({
				type: z.enum(["past", "live"]).optional(),
				page_size: z.number().int().optional(),
				next_page_token: z.string().optional(),
			}),
			output: z.object({
				page_size: z.number(),
				next_page_token: z.string().optional(),
				users: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						user_key: z.string().optional(),
						participant_uuid: z.string().optional(),
						device: z.string(),
						os: z.string().optional(),
						os_version: z.string().optional(),
						client: z.string().optional(),
						browser_name: z.string().optional(),
						browser_version: z.string().optional(),
						ip_address: z.string().optional(),
						location: z.string().optional(),
						data_center: z.string().optional(),
						connection_type: z.string().optional(),
						network_type: z
							.enum(["Wired", "Wifi", "PPP", "Cellular", "Others"])
							.optional(),
						as_connection_type: z.string().optional(),
						video_connection_type: z.string().optional(),
						microphone: z.string().optional(),
						speaker: z.string().optional(),
						camera: z.string().optional(),
						audio_quality: z.enum(["good", "fair", "poor", "bad"]).optional(),
						video_quality: z.enum(["good", "fair", "poor", "bad"]).optional(),
						screen_share_quality: z
							.enum(["good", "fair", "poor", "bad"])
							.optional(),
						is_original_host: z.boolean().optional(),
						join_time: z.string(),
						leave_time: z.string().optional(),
						leave_reason: z.string().optional(),
						audio_call: z
							.array(
								z.object({
									call_number: z.string().optional(),
									call_type: z.string().optional(),
									zoom_number: z.string().optional(),
								}),
							)
							.optional(),
					}),
				),
			}),
		},
		"/sessions/:sessionId/events": {
			method: "patch",
			input: z.object({
				method: z.enum(["recording.start", "recording.stop"]),
			}),
			params: z.object({
				sessionId,
			}),
		},
		"/sessions/:sessionId/livestream/status": {
			method: "patch",
			input: z.object({
				action: z.enum(["start", "stop", "mode"]),
				settings: z
					.object({
						active_speaker_name: z.boolean().optional(),
						close_caption: z.enum(["burnt-in", "embedded", "off"]).optional(),
						display_name: z.string().optional(),
						layout: z.enum(["gallery_view", "speaker_view"]).optional(),
					})
					.optional(),
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
