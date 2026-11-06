import { eq } from "drizzle-orm";
import { tryAPI, tryFunc } from "utils";
import { hasZoomVideo, mediaStorage, saveZoomVideo } from "@/aws/media";
import { schema } from "@/db";
import { db } from "@/services";
import { getZoomAPI } from "@/zoom/api";
import { zoomEvents } from "./webhook";

const VIDEO_FILE = /^(\d+)\.mp4$/;

function nextVideoIndex(keys: string[], sessionName: string) {
	const prefix = `${sessionName}/videos/`;

	const indexes = keys
		.map((key) => key.replace(/:/g, "/"))
		.filter((key) => key.startsWith(prefix))
		.flatMap((key) => {
			const match = VIDEO_FILE.exec(key.slice(prefix.length));
			return match ? [Number(match[1])] : [];
		});

	return indexes.length === 0 ? 0 : Math.max(...indexes) + 1;
}

export const zoomEventHandler = zoomEvents(
	{
		session: {
			started: async (c) => {
				const sessionName = c.var.data?.object.session_name;
				const sessionId = c.var.data?.object.session_id;

				if (!sessionName || !sessionId) return;

				await tryAPI(
					"zoom-session-started-update-slot",
					db
						.update(schema.slot)
						.set({
							status: "started",
							sessionId,
						})
						.where(eq(schema.slot.id, sessionName)),
				);

				const zoomAPI = await getZoomAPI();

				const { error } = await zoomAPI("/sessions/:sessionId/events", {
					params: { sessionId },
					body: { method: "recording.start" },
				});

				if (error) console.error(error);
			},
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

				const existingKeys = await tryAPI(
					"zoom-recording-list-existing-keys",
					mediaStorage.getKeys(sessionName),
				);

				let index = existingKeys
					? nextVideoIndex(existingKeys, sessionName)
					: 0;

				for (const file of videos) {
					const downloadUrl = file.download_url;
					const zoomFileId = file.id;

					if (!downloadUrl || !zoomFileId) continue;

					const saved = await tryAPI(
						"zoom-recording-check-duplicate",
						hasZoomVideo(sessionName, zoomFileId),
					);

					if (saved) continue;

					const key = `${sessionName}/videos/${index}.mp4`;

					console.log({ downloadUrl, zoomFileId, index, key });

					const data = await tryFunc(
						`zoom-recording-download-${index}`,
						async () => {
							const response = await fetch(downloadUrl, {
								headers: {
									authorization: `Bearer ${downloadToken}`,
								},
							});

							if (!response.ok)
								throw new Error(
									`Zoom recording download failed (${response.status}): ${downloadUrl}`,
								);

							return await response.arrayBuffer();
						},
					);

					if (!data) continue;

					await tryAPI(
						`zoom-recording-upload-${index}`,
						saveZoomVideo(key, new Uint8Array(data), zoomFileId),
					);

					index++;
				}
			},
		},
	},
	{
		before: async (c) => {
			console.log(c.var.category, c.var.event, ":", c.var.data);

			const sessionName = c.var.data?.object?.session_name;
			if (typeof sessionName !== "string") return;

			const slot = await tryAPI(
				"zoom-call-log-find-slot",
				db.query.slot.findFirst({
					where: { id: sessionName },
					columns: { id: true },
				}),
			);
			if (!slot) return;

			await tryAPI(
				"zoom-call-log-insert",
				db.insert(schema.slotLog).values({
					slotId: slot.id,
					category: c.var.category,
					event: c.var.event,
					data: c.var.data ?? {},
				}),
			);
		},
	},
);
