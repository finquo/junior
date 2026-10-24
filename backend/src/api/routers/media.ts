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

async function getMediaArtifact(id: string, path: string) {
	const meta = await mediaStorage.getMeta(`${id}/${path}`);
	if (!meta) return null;

	return {
		path,
		size: Number(meta.size ?? 0) || null,
	};
}

const toMediaPath = (id: string, key: string) =>
	key.replace(`${id}:`, "").replace(/:/g, "/");

const STATIC_ASSET_PATHS = [
	"video.mp4",
	"audio.mp3",
	"transcript/main.json",
	"summary/main.json",
	"summary/chunks.json",
] as const;

const isChunkAssetPath = (path: string) =>
	/^(chunks\/.*_\d+\.[^.]+|transcript\/chunks\/\d+\.json)$/.test(path);

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
			const { id } = input;

			const [chunkKeys, transcriptChunkKeys] = await Promise.all([
				getAPI(
					"aws-s3-list-audio-chunks",
					mediaStorage.getKeys(`${id}/chunks/`),
					[],
				),
				getAPI(
					"aws-s3-list-transcript-chunks",
					mediaStorage.getKeys(`${id}/transcript/chunks/`),
					[],
				),
			]);

			const [video, audio, transcript, summary, chunkSummary] =
				await Promise.all([
					getMediaArtifact(id, "video.mp4"),
					getMediaArtifact(id, "audio.mp3"),
					getMediaArtifact(id, "transcript/main.json"),
					getMediaArtifact(id, "summary/main.json"),
					getMediaArtifact(id, "summary/chunks.json"),
				]);

			const chunkPaths = chunkKeys
				.map((key) => toMediaPath(id, key))
				.filter((path) => /_(\d+)\.[^.]+$/.test(path));

			const transcriptChunkPaths = transcriptChunkKeys.map((key) =>
				toMediaPath(id, key),
			);

			const chunks = await Promise.all(
				chunkPaths.map(async (path) => {
					const number = path.match(/_(\d+)\.[^.]+$/)?.[1] ?? null;
					const transcriptPath = number
						? `transcript/chunks/${number}.json`
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

	download: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string().min(1), path: z.string().min(1) }))
		.handler(async ({ input }) => {
			const allowed =
				(STATIC_ASSET_PATHS as readonly string[]).includes(input.path) ||
				isChunkAssetPath(input.path);
			if (!allowed)
				throw getError(
					"INPUT_VALIDATION",
					`Unknown media asset path for ${input.id}: ${input.path}`,
				);

			const key = `${input.id}/${input.path}`;
			const meta = await mediaStorage.getMeta(key);
			if (!meta)
				throw getError("NOT_FOUND", `Media asset not found: ${input.path}`);

			const url = await tryAPI(
				"aws-s3-presign-download",
				getMediaDownloadURL(key),
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
