import { eq, inArray, sql } from "drizzle-orm";
import { tryAPI, tryFunc } from "utils";
import {
	hasZoomVideo,
	mediaKey,
	mediaStorage,
	nextVideoIndex,
	saveZoomVideo,
} from "@/aws/media";
import type { SlotParticipant } from "@/config";
import { schema } from "@/db";
import { db } from "@/services";
import { getZoomAPI } from "@/zoom/api";
import { zoomEvents } from "./webhook";

export const zoomEventHandler = zoomEvents(
	{
		session: {
			started: async (c) => {
				const sessionName = c.var.data?.object.session_name;
				const sessionId = c.var.data?.object.session_id;
				const sessionKey = c.var.data?.object.session_key ?? sessionId;

				if (!sessionName || !sessionId) return;

				await tryAPI(
					"zoom-session-started-update-slot",
					db
						.update(schema.slot)
						.set({
							status: "started",
							sessionKey,
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

				const slot = await tryAPI(
					"zoom-session-ended-find-slot",
					db.query.slot.findFirst({
						where: { id: sessionName },
						columns: { id: true, sessionKey: true, participants: true },
					}),
				);

				if (!slot) return;

				const sessionKey = c.var.data?.object.session_key ?? slot.sessionKey;
				const participants = slot.participants.filter(
					(participant) => participant.sessionKey === sessionKey,
				);
				const userIds = [...new Set(participants.map((p) => p.userId))];

				const users = userIds.length
					? ((await tryAPI(
							"zoom-session-ended-find-users",
							db
								.select({ id: schema.user.id, role: schema.user.role })
								.from(schema.user)
								.where(inArray(schema.user.id, userIds)),
						)) ?? [])
					: [];

				const teachers = users.filter((user) => user.role === "teacher");

				if (userIds.length < 2 || teachers.length < 1) return;

				await tryAPI(
					"zoom-session-ended-update-slot",
					db
						.update(schema.slot)
						.set({
							status: "attended",
							endTime: new Date(timestamp),
						})
						.where(eq(schema.slot.id, slot.id)),
				);
			},
			user_joined: async (c) => {
				const sessionName = c.var.data?.object.session_name;
				const user = c.var.data?.object.user;
				const userId = user?.user_key;

				if (!sessionName || !user || !userId) return;

				const slot = await tryAPI(
					"zoom-user-joined-find-slot",
					db.query.slot.findFirst({
						where: { id: sessionName },
						columns: { id: true, sessionKey: true },
					}),
				);

				const sessionKey = c.var.data?.object.session_key ?? slot?.sessionKey;

				if (!slot || !sessionKey) return;

				const participant: SlotParticipant = {
					userId,
					sessionKey,
					name: user.name,
					joinedAt: user.join_time,
					leftAt: null,
				};

				await tryAPI(
					"zoom-user-joined-append-participant",
					db
						.update(schema.slot)
						.set({
							participants: sql`array_append(${schema.slot.participants}, ${JSON.stringify(participant)}::jsonb)`,
						})
						.where(eq(schema.slot.id, slot.id)),
				);
			},
			user_left: async (c) => {
				const sessionName = c.var.data?.object.session_name;
				const user = c.var.data?.object.user;
				const userId = user?.user_key;

				if (!sessionName || !user || !userId) return;

				const slot = await tryAPI(
					"zoom-user-left-find-slot",
					db.query.slot.findFirst({
						where: { id: sessionName },
						columns: { id: true, sessionKey: true },
					}),
				);

				const sessionKey = c.var.data?.object.session_key ?? slot?.sessionKey;

				if (!slot || !sessionKey) return;

				await tryAPI(
					"zoom-user-left-update-participant",
					db
						.update(schema.slot)
						.set({
							participants: sql`ARRAY(SELECT CASE WHEN p->>'userId' = ${userId} AND p->>'sessionKey' = ${sessionKey} AND p->>'leftAt' IS NULL THEN jsonb_set(p, '{leftAt}', to_jsonb(${user.leave_time}::text)) ELSE p END FROM unnest(${schema.slot.participants}) AS p)`,
						})
						.where(eq(schema.slot.id, slot.id)),
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

					const key = mediaKey(sessionName, `videos/${index}.mp4`);

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
