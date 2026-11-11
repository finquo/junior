import { eq } from "drizzle-orm";
import z from "zod";
import { summarizeTranscript } from "@/ai/summarize";
import { transcribeAudio, transcribeAudioChunk } from "@/ai/transcribe";
import { createSplitAudioJob, createToAudioJob } from "@/aws/job";
import {
	byNumber,
	CHUNK_FILE,
	CHUNK_LENGTH_SECONDS,
	getMediaArtifact,
	getMediaDownloadURL,
	getMediaMeta,
	getMediaViewURL,
	isAllowedAssetPath,
	listMediaFiles,
	mediaKey,
	mediaStorage,
	normalizeMediaKey,
	toMediaPath,
} from "@/aws/media";
import { notifySlotSummary } from "@/chat/notify";
import { schema } from "@/db";
import { db } from "@/services";
import { MapRole } from "@/utils/role";
import { getAPI, getError, getRolesProcedure, tryAPI } from "../procedure";

type TranscriptSegment = {
	text: string;
	startSecond: number;
	endSecond: number;
};

const videoIndex = z.number().int().min(0).default(0);

async function getMissingTranscripts(id: string, keys: string[]) {
	const missing: string[] = [];

	for (const key of keys) {
		const [, , number, filename] = normalizeMediaKey(key).split("/");
		const match = filename?.match(CHUNK_FILE);
		if (!number || !match?.[2]) continue;

		const transcript = await getMediaMeta(
			`${id}/transcript-chunks/${Number(number)}/${Number(match[2])}.json`,
		);
		if (!transcript) missing.push(key);
	}

	return missing;
}

export const mediaRouter = {
	jobs: {
		toAudio: getRolesProcedure(["admin", "scheduler"])
			.input(z.object({ id: z.string().min(1), index: videoIndex }))
			.handler(({ input }) =>
				tryAPI(
					"aws-mediaconvert-video-to-audio",
					createToAudioJob({ id: input.id, index: input.index }),
				),
			),

		splitAudio: getRolesProcedure(["admin", "scheduler"])
			.input(z.object({ id: z.string().min(1), index: videoIndex }))
			.handler(({ input }) =>
				tryAPI(
					"aws-mediaconvert-split-audio",
					createSplitAudioJob({ id: input.id, index: input.index }),
				),
			),
	},

	video: getRolesProcedure(["admin", "scheduler", "qa_auditor"])
		.input(z.object({ id: z.string().min(1), index: videoIndex }))
		.handler(async ({ input }) => {
			const key = `${input.id}/videos/${input.index}.mp4`;
			const meta = await getMediaMeta(key);
			if (!meta) throw getError("NOT_FOUND", `Video not found for ${input.id}`);

			return {
				url: await tryAPI("aws-s3-presign-video", getMediaDownloadURL(key)),
				size: meta.size ?? null,
			};
		}),

	audio: getRolesProcedure(["admin", "scheduler", "qa_auditor"])
		.input(z.object({ id: z.string().min(1), index: videoIndex }))
		.handler(async ({ input }) => {
			const key = `${input.id}/audios/${input.index}.mp3`;
			const meta = await getMediaMeta(key);
			if (!meta) throw getError("NOT_FOUND", `Audio not found for ${input.id}`);

			return {
				url: await tryAPI("aws-s3-presign-audio", getMediaDownloadURL(key)),
				size: meta.size ?? null,
			};
		}),

	chunks: {
		list: getRolesProcedure(["admin", "scheduler", "qa_auditor"])
			.input(z.object({ id: z.string().min(1), index: videoIndex }))
			.handler(async ({ input }) => {
				const keys = await getAPI(
					"aws-s3-list-audio-chunks",
					mediaStorage.getKeys(`${input.id}/audio-chunks/${input.index}/`),
					[],
				);

				return Promise.all(keys.map((key) => getMediaMeta(key)));
			}),
	},

	meta: getRolesProcedure(["admin", "scheduler", "qa_auditor"])
		.input(z.object({ id: z.string().min(1), index: videoIndex }))
		.handler(async ({ input }) => {
			const { id, index: n } = input;

			const [chunkKeys, transcriptChunkKeys] = await Promise.all([
				getAPI(
					"aws-s3-list-audio-chunks",
					mediaStorage.getKeys(`${id}/audio-chunks/${n}/`),
					[],
				),
				getAPI(
					"aws-s3-list-transcript-chunks",
					mediaStorage.getKeys(`${id}/transcript-chunks/${n}/`),
					[],
				),
			]);

			const [video, audio, transcript, summary, chunkSummary] =
				await Promise.all([
					getMediaArtifact(id, `videos/${n}.mp4`),
					getMediaArtifact(id, `audios/${n}.mp3`),
					getMediaArtifact(id, `transcript-single/${n}.json`),
					getMediaArtifact(id, "summary/main.json"),
					getMediaArtifact(id, "summary/chunks.json"),
				]);

			const chunkPaths = chunkKeys
				.map((key) => toMediaPath(id, key))
				.filter((path) => CHUNK_FILE.test(path));

			const transcriptChunkPaths = transcriptChunkKeys.map((key) =>
				toMediaPath(id, key),
			);

			const chunks = await Promise.all(
				chunkPaths.map(async (path) => {
					const number = path.match(CHUNK_FILE)?.[2] ?? null;
					const transcriptPath = number
						? `transcript-chunks/${n}/${Number(number)}.json`
						: null;
					if (
						!transcriptPath ||
						!transcriptChunkPaths.includes(transcriptPath)
					) {
						return { path, number, transcript: null };
					}

					return {
						path,
						number,
						transcript: { path: transcriptPath },
					};
				}),
			);

			return { video, audio, transcript, summary, chunkSummary, chunks };
		}),

	download: getRolesProcedure(["admin", "scheduler", "qa_auditor"])
		.input(
			z.object({
				id: z.string().min(1),
				path: z.string().min(1),
				inline: z.boolean().optional(),
			}),
		)
		.handler(async ({ input }) => {
			if (!isAllowedAssetPath(input.path))
				throw getError(
					"INPUT_VALIDATION",
					`Unknown media asset path for ${input.id}: ${input.path}`,
				);
			const key = `${input.id}/${input.path}`;
			const meta = await getMediaMeta(key);
			if (!meta)
				throw getError("NOT_FOUND", `Media asset not found: ${input.path}`);

			const url = await tryAPI(
				"aws-s3-presign-download",
				input.inline
					? getMediaViewURL(key)
					: getMediaDownloadURL(key, undefined, key.split("/").pop()),
			);
			if (!url)
				throw getError(
					"INTERNAL_SERVER_ERROR",
					"Failed to presign download URL",
				);

			return {
				url,
				name: key.split("/").pop() ?? input.path,
			};
		}),

	delete: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1), path: z.string().min(1) }))
		.handler(async ({ input }) => {
			if (!isAllowedAssetPath(input.path))
				throw getError(
					"INPUT_VALIDATION",
					`Unknown media asset path for ${input.id}: ${input.path}`,
				);

			const key = `${input.id}/${input.path}`;
			const meta = await getMediaMeta(key);
			if (!meta)
				throw getError("NOT_FOUND", `Media asset not found: ${input.path}`);

			await tryAPI("aws-s3-delete-media", mediaStorage.removeItem(key));

			return { path: input.path };
		}),

	summarize: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1), index: videoIndex }))
		.handler(async ({ input }) => {
			const inputKey = `${input.id}/transcript-single/${input.index}.json`;
			const segments =
				await mediaStorage.getItem<TranscriptSegment[]>(inputKey);
			if (!segments)
				throw getError("NOT_FOUND", `Transcript not found for ${input.id}`);

			const transcript = segments
				.map(
					(segment, index) =>
						`${index + 1}. UNKNOWN [${segment.startSecond}s-${segment.endSecond}s]: ${segment.text.trim()}`,
				)
				.join("\n");

			const previous = await tryAPI(
				"db-media-summarize-previous-slot",
				db.query.slot.findFirst({
					where: { id: input.id },
					columns: { summary: true },
				}),
			);

			const summary = await tryAPI(
				"ai-summarize-transcript",
				summarizeTranscript(transcript, previous?.summary),
			);
			const outputKey = `${input.id}/summary/main.json`;

			await tryAPI(
				"aws-s3-save-summary",
				mediaStorage.setItem(outputKey, JSON.stringify(summary, null, 2)),
			);

			await tryAPI(
				"db-media-summarize-save-slot",
				db
					.update(schema.slot)
					.set({ summary })
					.where(eq(schema.slot.id, input.id)),
			);

			return { outputKey, summary };
		}),

	summarizeChunks: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1), index: videoIndex }))
		.handler(async ({ input }) => {
			const keys = await getAPI(
				"aws-s3-list-transcript-chunks",
				mediaStorage.getKeys(`${input.id}/transcript-chunks/${input.index}/`),
				[],
			);
			keys.sort(byNumber);

			const transcripts = await Promise.all(
				keys.map((key) => mediaStorage.getItem<TranscriptSegment[]>(key)),
			);

			const transcript = transcripts
				.map((segments, index) => {
					if (!segments?.length) return "";

					const lines = segments
						.map(
							(segment, line) =>
								`${line + 1}. UNKNOWN [${segment.startSecond}s-${segment.endSecond}s]: ${segment.text.trim()}`,
						)
						.join("\n");

					return `CHUNK ${index + 1}\n${lines}`;
				})
				.filter(Boolean)
				.join("\n\n");

			if (!transcript)
				throw getError(
					"NOT_FOUND",
					`Transcript chunks not found for ${input.id}`,
				);

			const previous = await tryAPI(
				"db-media-summarize-chunks-previous-slot",
				db.query.slot.findFirst({
					where: { id: input.id },
					columns: { summary: true },
				}),
			);

			const summary = await tryAPI(
				"ai-summarize-transcript-chunks",
				summarizeTranscript(transcript, previous?.summary),
			);
			const outputKey = `${input.id}/summary/chunks.json`;

			await tryAPI(
				"aws-s3-save-summary-chunks",
				mediaStorage.setItem(outputKey, JSON.stringify(summary, null, 2)),
			);

			const videos = await getAPI(
				"aws-s3-list-videos",
				mediaStorage.getKeys(`${input.id}/videos/`),
				[],
			);

			if (videos.length === 1) {
				await tryAPI(
					"db-media-summarize-chunks-save-slot",
					db
						.update(schema.slot)
						.set({ summary })
						.where(eq(schema.slot.id, input.id)),
				);
			}

			return { outputKey, summary };
		}),

	summarizeAll: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }) => {
			const keys = await getAPI(
				"aws-s3-list-all-transcript-chunks",
				mediaStorage.getKeys(`${input.id}/transcript-chunks/`),
				[],
			);

			const items = keys
				.map((key) => {
					const [, , video, file] = normalizeMediaKey(key).split("/");
					const chunk = file?.match(/^(\d+)\.json$/)?.[1];
					if (!video || !chunk) return null;
					return { key, video: Number(video), chunk: Number(chunk) };
				})
				.filter((item) => item !== null)
				.sort((a, b) => a.video - b.video || a.chunk - b.chunk);

			const transcripts = await Promise.all(
				items.map(async (item) => ({
					...item,
					segments: await mediaStorage.getItem<TranscriptSegment[]>(item.key),
				})),
			);

			const transcript = transcripts
				.map(({ video, chunk, segments }) => {
					if (!segments?.length) return "";

					const lines = segments
						.map(
							(segment, line) =>
								`${line + 1}. UNKNOWN [${segment.startSecond}s-${segment.endSecond}s]: ${segment.text.trim()}`,
						)
						.join("\n");

					return `VIDEO ${video} CHUNK ${chunk}\n${lines}`;
				})
				.filter(Boolean)
				.join("\n\n");

			if (!transcript)
				throw getError(
					"NOT_FOUND",
					`Transcript chunks not found for ${input.id}`,
				);

			const previous = await tryAPI(
				"db-media-summarize-all-previous-slot",
				db.query.slot.findFirst({
					where: { id: input.id },
					columns: { summary: true },
				}),
			);

			const summary = await tryAPI(
				"ai-summarize-transcript-all",
				summarizeTranscript(transcript, previous?.summary),
			);

			await tryAPI(
				"db-media-summarize-all-save-slot",
				db
					.update(schema.slot)
					.set({ summary })
					.where(eq(schema.slot.id, input.id)),
			);

			return { summary };
		}),

	sendSummary: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string().min(1),
				source: z.enum(["main", "chunks"]).optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			// Demo sandbox. Remove this branch before deploying.
			if (input.id === "demo") {
				const link = `${new URL(context.req.url).origin}/analytics/slots/demo`;

				await notifySlotSummary({
					name: "Demo",
					phoneNumber: "+919846101882",
					link,
				});

				return { link };
			}

			const slot = await tryAPI(
				"db-media-send-summary-slot",
				db.query.slot.findFirst({
					where: MapRole(context.role, {
						admin: { id: input.id },
						scheduler: { id: input.id, schedulerId: context.user.id },
					}),
					with: {
						student: {
							with: { user: { columns: { name: true, phoneNumber: true } } },
						},
					},
				}),
			);

			if (!slot) throw getError("NOT_FOUND", "Session not found");

			const isChunks = input.source === "chunks";

			const summaryMeta = await getMediaMeta(
				`${input.id}/summary/${isChunks ? "chunks" : "main"}.json`,
			);
			if (!summaryMeta)
				throw getError("NOT_FOUND", "Summary not generated yet");

			const student = slot.student?.user;
			if (!student) throw getError("NOT_FOUND", "Student not found");

			if (!student.phoneNumber) {
				throw getError("BAD_REQUEST", "Student has no phone number");
			}

			const link = `${new URL(context.req.url).origin}/analytics/slots/${input.id}`;

			await notifySlotSummary({
				name: student.name,
				phoneNumber: student.phoneNumber,
				link,
			});

			return { link };
		}),
	summarizeRaw: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ text: z.string().min(1) }))
		.handler(({ input }) =>
			tryAPI("ai-summarize-raw", summarizeTranscript(input.text)),
		),

	transcribeAudio: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1), index: videoIndex }))
		.handler(({ input }) =>
			tryAPI(
				"aws-transcribe-audio",
				transcribeAudio(`${input.id}/audios/${input.index}.mp3`),
			),
		),

	transcribeAudioChunks: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string().min(1),
				index: videoIndex,
				onlyMissing: z.boolean().optional(),
				chunk: z.string().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const keys = await getAPI(
				"aws-s3-list-audio-chunks",
				mediaStorage.getKeys(`${input.id}/audio-chunks/${input.index}/`),
				[],
			);

			const chunks = keys.filter(
				(key) =>
					CHUNK_FILE.test(key) && (!input.chunk || key.endsWith(input.chunk)),
			);

			const pending = input.onlyMissing
				? await getMissingTranscripts(input.id, chunks)
				: chunks;

			const results = await Promise.allSettled(
				pending.map((key) =>
					tryAPI("aws-transcribe-audio-chunk", transcribeAudioChunk(key)),
				),
			);

			const failed = results.filter((result) => result.status === "rejected");

			if (failed.length > 0)
				throw getError(
					"INTERNAL_SERVER_ERROR",
					`${failed.length} of ${pending.length} chunks failed to transcribe`,
				);

			return results;
		}),

	deleteChunks: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				id: z.string().min(1),
				index: videoIndex,
				target: z.enum(["audio", "transcripts"]),
			}),
		)
		.handler(async ({ input }) => {
			const folder =
				input.target === "audio" ? "audio-chunks" : "transcript-chunks";

			const keys = await getAPI(
				"aws-s3-list-chunk-files",
				mediaStorage.getKeys(`${input.id}/${folder}/${input.index}/`),
				[],
			);

			await tryAPI(
				"aws-s3-delete-chunk-files",
				Promise.all(keys.map((key) => mediaStorage.removeItem(key))),
			);

			return { index: input.index, deleted: keys.length };
		}),

	mergeChunks: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1), index: videoIndex }))
		.handler(async ({ input }) => {
			const keys = await getAPI(
				"aws-s3-list-transcript-chunks",
				mediaStorage.getKeys(`${input.id}/transcript-chunks/${input.index}/`),
				[],
			);
			keys.sort(byNumber);

			if (keys.length === 0)
				throw getError(
					"NOT_FOUND",
					`Transcript chunks not found for ${input.id}/${input.index}`,
				);

			const chunks = await Promise.all(
				keys.map((key) => mediaStorage.getItem<TranscriptSegment[]>(key)),
			);

			const segments = chunks.flatMap((chunk, position) =>
				(chunk ?? []).map((segment) => ({
					...segment,
					startSecond: segment.startSecond + position * CHUNK_LENGTH_SECONDS,
					endSecond: segment.endSecond + position * CHUNK_LENGTH_SECONDS,
				})),
			);

			const outputKey = mediaKey(input.id, `transcript/${input.index}.json`);

			await tryAPI(
				"aws-s3-save-merged-transcript",
				mediaStorage.setItem(outputKey, JSON.stringify(segments, null, 2)),
			);

			return { outputKey, segments };
		}),

	library: {
		list: getRolesProcedure(["admin", "scheduler", "qa_auditor"]).handler(
			async () => {
				const keys = await getAPI(
					"aws-s3-list-media-library-keys",
					mediaStorage.getKeys(),
					[],
				);

				const grouped = new Map<string, string[]>();
				for (const raw of keys) {
					const key = normalizeMediaKey(raw);
					const slotId = key.split("/")[0];
					if (!slotId || key === slotId) continue;

					grouped.set(slotId, [...(grouped.get(slotId) ?? []), key]);
				}

				return [...grouped].map(([slotId, files]) => ({ slotId, files }));
			},
		),

		files: getRolesProcedure(["admin", "scheduler", "qa_auditor"])
			.input(z.object({ id: z.string().min(1) }))
			.handler(async ({ input }) => {
				const keys = await getAPI(
					"aws-s3-list-media-library-files",
					listMediaFiles(input.id),
					[],
				);

				return keys.map(normalizeMediaKey);
			}),

		deleteSlot: getRolesProcedure(["admin", "scheduler"])
			.input(z.object({ id: z.string().min(1) }))
			.handler(async ({ input }) => {
				const keys = await getAPI(
					"aws-s3-list-slot-files",
					mediaStorage.getKeys(input.id),
					[],
				);
				if (keys.length === 0)
					throw getError("NOT_FOUND", `No files found for ${input.id}`);

				await tryAPI(
					"aws-s3-delete-slot-files",
					Promise.all(keys.map((key) => mediaStorage.removeItem(key))),
				);

				return { id: input.id, deleted: keys.length };
			}),

		delete: getRolesProcedure(["admin", "scheduler"])
			.input(
				z.object({
					key: z
						.string()
						.min(1)
						.refine((key) => key.includes("/") && !key.includes(".."), {
							message: "Key must be <slotId>/<file>",
						}),
				}),
			)
			.handler(async ({ input }) => {
				const meta = await getMediaMeta(input.key);
				if (!meta) throw getError("NOT_FOUND", `File not found: ${input.key}`);

				await tryAPI(
					"aws-s3-delete-library-file",
					mediaStorage.removeItem(input.key),
				);

				return { key: input.key };
			}),

		download: getRolesProcedure(["admin", "scheduler", "qa_auditor"])
			.input(
				z.object({
					key: z
						.string()
						.min(1)
						.refine((key) => key.includes("/") && !key.includes(".."), {
							message: "Key must be <slotId>/<file>",
						}),
					inline: z.boolean().optional(),
				}),
			)
			.handler(async ({ input }) => {
				const meta = await getMediaMeta(input.key);
				if (!meta) throw getError("NOT_FOUND", `File not found: ${input.key}`);

				const url = await tryAPI(
					"aws-s3-presign-library-download",
					input.inline
						? getMediaViewURL(input.key)
						: getMediaDownloadURL(
								input.key,
								undefined,
								input.key.split("/").pop(),
							),
				);
				if (!url)
					throw getError(
						"INTERNAL_SERVER_ERROR",
						"Failed to presign download URL",
					);

				return {
					url,
					name: input.key.split("/").pop() ?? input.key,
				};
			}),
	},
};
