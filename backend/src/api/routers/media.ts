import z from "zod";
import { transcribeAudio, transcribeAudioChunk } from "@/ai/transcribe";
import {
	createSplitAudioJob,
	createToAudioJob,
	getMediaDownloadURL,
	mediaStorage,
} from "@/aws/media";
import { getAPI, getError, getRolesProcedure, tryAPI } from "../procedure";

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
