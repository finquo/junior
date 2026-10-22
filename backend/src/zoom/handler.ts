import { eq } from "drizzle-orm";
import { mediaStorage } from "@/aws/media";
import { schema } from "@/db";
import { db } from "../services";
import { tryAPI } from "./jwt";
import { zoomEvents } from "./webhook";

export const zoomEventHandler = zoomEvents(
	{
		session: {
			ended: async (c) => {
				const sessionName = c.var.data?.object.session_name;
				const timestamp = c.var.timestamp;

				if (!sessionName || !timestamp) return;

				await tryAPI(
					"zoom-session-ended-update-slot",
					db
						.update(schema.slot)
						.set({
							status: "attended",
							endTime: new Date(timestamp),
						})
						.where(eq(schema.slot.id, sessionName)),
				);
			},
			recording_completed: async (c) => {
				const sessionName = c.var.data?.object.session_name;
				const downloadToken = c.var.downloadToken;
				const files = c.var.data?.object.recording_files ?? [];

				if (!sessionName || !downloadToken) return;

				const videos = files.filter((file) => {
					const extension = file.file_extension ?? file.file_type;

					return extension?.toUpperCase() === "MP4";
				});

				await Promise.all(
					videos.map((file, index) => {
						const downloadUrl = file.download_url;

						if (!downloadUrl) return Promise.resolve();

						const key =
							index === 0
								? `${sessionName}/video.mp4`
								: `${sessionName}/video_${index}.mp4`;

						return tryAPI(
							`zoom-recording-upload-${index}`,
							(async () => {
								const response = await fetch(downloadUrl, {
									headers: {
										authorization: `Bearer ${downloadToken}`,
									},
								});

								if (!response.ok) {
									throw new Error(
										`Zoom recording download failed (${response.status}): ${downloadUrl}`,
									);
								}

								const bytes = new Uint8Array(await response.arrayBuffer());
								await mediaStorage.setItemRaw(key, bytes);
							})(),
						);
					}),
				);
			},
		},
	},
	{
		before: async (c) => {
			console.log(c.var.category, c.var.event, ":", c.var.data);
		},
	},
);
