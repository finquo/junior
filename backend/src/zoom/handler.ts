import { eq } from "drizzle-orm";
import { tryAPI, tryFunc } from "utils";
import { mediaStorage } from "@/aws/media";
import { schema } from "@/db";
import { db } from "@/services";
import { zoomEvents } from "./webhook";

const VIDEO_FILE = /^video(?:_(\d+))?\.mp4$/;

function nextVideoIndex(keys: string[], sessionName: string) {
	const prefix = `${sessionName}/`;

	const indexes = keys
		.map((key) => key.replace(/:/g, "/"))
		.filter((key) => key.startsWith(prefix))
		.flatMap((key) => {
			const match = VIDEO_FILE.exec(key.slice(prefix.length));
			return match ? [Number(match[1] ?? 0)] : [];
		});

	return indexes.length === 0 ? 0 : Math.max(...indexes) + 1;
}

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

				const downloadUrls = videos.flatMap((file) =>
					file.download_url ? [file.download_url] : [],
				);

				const existingKeys = await tryAPI(
					"zoom-recording-list-existing-keys",
					mediaStorage.getKeys(sessionName),
				);

				const start = existingKeys
					? nextVideoIndex(existingKeys, sessionName)
					: 0;

				for (const [offset, downloadUrl] of downloadUrls.entries()) {
					const index = start + offset;

					const key =
						index === 0
							? `${sessionName}/video.mp4`
							: `${sessionName}/video_${index}.mp4`;

					console.log({ offset, downloadUrl, index, key });

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
						mediaStorage.setItemRaw(key, new Uint8Array(data)),
					);
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
