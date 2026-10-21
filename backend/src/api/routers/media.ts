import { normalizeKey } from "unstorage";
import z from "zod";
import {
	createSplitAudioJob,
	createToAudioJob,
	getMediaDownloadURL,
	mediaStorage,
} from "@/aws/media";
import { getError, getRolesProcedure, tryAPI } from "../procedure";

const jobInput = z.object({ id: z.string().min(1) });
const chunkInput = jobInput.extend({
	number: z.number().int().positive(),
});

const getFile = async (key: string, tag: string) => {
	const meta = await tryAPI(
		`aws-s3-head-${tag}`,
		Promise.resolve(mediaStorage.getMeta(key)),
	);
	if (!meta) throw getError("NOT_FOUND", `Media not found: ${key}`);

	return {
		url: await tryAPI(`aws-s3-presign-${tag}`, getMediaDownloadURL(key)),
		size: meta.size ?? null,
	};
};

const listChunkFiles = async (id: string) => {
	const keys =
		(await tryAPI(
			"aws-s3-list-audio-chunks",
			Promise.resolve(mediaStorage.getKeys()),
		)) ?? [];

	const prefix = normalizeKey(`${id}/chunks/`);
	const chunks = keys
		.filter((key) => key.startsWith(prefix) && key.endsWith(".aac"))
		.map((key) => {
			const name = key.slice(prefix.length);
			const match = name.match(/_(\d+)\.aac$/);
			if (!match) return null;

			return { number: Number(match[1]), name };
		})
		.filter((chunk) => chunk !== null)
		.sort((a, b) => a.number - b.number);

	return chunks;
};

const getChunkURL = (id: string, name: string) =>
	tryAPI(
		"aws-s3-presign-audio-chunk",
		getMediaDownloadURL(`${id}/chunks/${name}`),
	);

const listChunks = async (id: string) => {
	const files = await listChunkFiles(id);

	return Promise.all(
		files.map(async (chunk) => ({
			...chunk,
			url: await getChunkURL(id, chunk.name),
		})),
	);
};

export const mediaRouter = {
	jobs: {
		toAudio: getRolesProcedure(["admin", "scheduler"])
			.input(jobInput)
			.handler(({ input }) =>
				tryAPI("aws-mediaconvert-video-to-audio", createToAudioJob(input)),
			),

		splitAudio: getRolesProcedure(["admin", "scheduler"])
			.input(jobInput)
			.handler(({ input }) =>
				tryAPI("aws-mediaconvert-split-audio", createSplitAudioJob(input)),
			),
	},

	video: getRolesProcedure(["admin", "scheduler"])
		.input(jobInput)
		.handler(({ input }) => getFile(`${input.id}/video.mp4`, "video")),

	audio: getRolesProcedure(["admin", "scheduler"])
		.input(jobInput)
		.handler(({ input }) => getFile(`${input.id}/audio.mp3`, "audio")),

	chunks: {
		list: getRolesProcedure(["admin", "scheduler"])
			.input(jobInput)
			.handler(({ input }) => listChunks(input.id)),

		get: getRolesProcedure(["admin", "scheduler"])
			.input(chunkInput)
			.handler(async ({ input }) => {
				const chunks = await listChunkFiles(input.id);
				const chunk = chunks.find((item) => item.number === input.number);
				if (!chunk)
					throw getError(
						"NOT_FOUND",
						`Audio chunk ${input.number} not found for ${input.id}`,
					);

				return {
					...chunk,
					url: await getChunkURL(input.id, chunk.name),
				};
			}),
	},
};
