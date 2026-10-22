import z from "zod";
import { summarizeTranscript } from "@/ai/summarize";
import { transcribeAudio, transcribeAudioChunk } from "@/ai/transcribe";
import {
	createSplitAudioJob,
	createToAudioJob,
	getMediaDownloadURL,
	mediaStorage,
} from "@/aws/media";
import { getAPI, getError, getRolesProcedure, tryAPI } from "../procedure";

type TranscriptSegment = {
	text: string;
	startSecond: number;
	endSecond: number;
};

export const mediaRouter = {
	jobs: {
		toAudio: getRolesProcedure(["admin", "scheduler"])
			.input(z.object({ id: z.string().min(1) }))
			.handler(({ input }) =>
				tryAPI(
					"aws-mediaconvert-video-to-audio",
					createToAudioJob({ id: input.id }),
				),
			),

		splitAudio: getRolesProcedure(["admin", "scheduler"])
			.input(z.object({ id: z.string().min(1) }))
			.handler(({ input }) =>
				tryAPI(
					"aws-mediaconvert-split-audio",
					createSplitAudioJob({ id: input.id }),
				),
			),
	},

	video: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }) => {
			const key = `${input.id}/video.mp4`;
			const meta = await mediaStorage.getMeta(key);
			if (!meta) throw getError("NOT_FOUND", `Video not found for ${input.id}`);

			return {
				url: await tryAPI("aws-s3-presign-video", getMediaDownloadURL(key)),
				size: meta.size ?? null,
			};
		}),

	audio: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }) => {
			const key = `${input.id}/audio.mp3`;
			const meta = await mediaStorage.getMeta(key);
			if (!meta) throw getError("NOT_FOUND", `Audio not found for ${input.id}`);

			return {
				url: await tryAPI("aws-s3-presign-audio", getMediaDownloadURL(key)),
				size: meta.size ?? null,
			};
		}),

	chunks: {
		list: getRolesProcedure(["admin", "scheduler"])
			.input(z.object({ id: z.string().min(1) }))
			.handler(async ({ input }) => {
				const keys = await getAPI(
					"aws-s3-list-audio-chunks",
					mediaStorage.getKeys(`${input.id}/chunks/`),
					[],
				);

				return Promise.all(keys.map((key) => mediaStorage.getMeta(key)));
			}),
	},

	meta: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }) => {
			const chunkKeys = await getAPI(
				"aws-s3-list-audio-chunks",
				mediaStorage.getKeys(`${input.id}/chunks/`),
				[],
			);

			const [video, audio, chunks] = await Promise.all([
				mediaStorage.getMeta(`${input.id}/video.mp4`),
				mediaStorage.getMeta(`${input.id}/audio.mp3`),
				Promise.all(chunkKeys.map((key) => mediaStorage.getMeta(key))),
			]);

			return {
				video: video ?? null,
				audio: audio ?? null,
				chunks,
			};
		}),

	summarize: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }) => {
			const inputKey = `${input.id}/transcript/main.json`;
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

			const summary = await tryAPI(
				"ai-summarize-transcript",
				summarizeTranscript(transcript),
			);
			const outputKey = `${input.id}/summary/main.json`;

			await tryAPI(
				"aws-s3-save-summary",
				mediaStorage.setItem(outputKey, JSON.stringify(summary, null, 2)),
			);

			return { outputKey, summary };
		}),

	summarizeChunks: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }) => {
			const keys = await getAPI(
				"aws-s3-list-transcript-chunks",
				mediaStorage.getKeys(`${input.id}/transcript/chunks/`),
				[],
			);
			keys.sort();

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

			const summary = await tryAPI(
				"ai-summarize-transcript-chunks",
				summarizeTranscript(transcript),
			);
			const outputKey = `${input.id}/summary/chunks.json`;

			await tryAPI(
				"aws-s3-save-summary-chunks",
				mediaStorage.setItem(outputKey, JSON.stringify(summary, null, 2)),
			);

			return { outputKey, summary };
		}),

	summarizeRaw: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ text: z.string().min(1) }))
		.handler(({ input }) =>
			tryAPI("ai-summarize-raw", summarizeTranscript(input.text)),
		),

	transcribeAudio: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1) }))
		.handler(({ input }) =>
			tryAPI("aws-transcribe-audio", transcribeAudio(`${input.id}/audio.mp3`)),
		),

	transcribeAudioChunks: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }) => {
			const keys = await getAPI(
				"aws-s3-list-audio-chunks",
				mediaStorage.getKeys(`${input.id}/chunks/`),
				[],
			);

			const chunks = keys.filter((key) => /_(\d+)\.[^.]+$/.test(key));

			return Promise.all(
				chunks.map((key) =>
					tryAPI("aws-transcribe-audio-chunk", transcribeAudioChunk(key)),
				),
			);
		}),
};
