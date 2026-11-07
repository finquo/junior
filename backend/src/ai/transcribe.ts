import { transcribe } from "ai";
import { normalizeKey } from "unstorage";
import { CHUNK_FILE, mediaKey, mediaStorage } from "../aws/media";
import { openrouter } from "./index";

function toSegments(result: {
	text: string;
	segments: { text: string; startSecond: number; endSecond: number }[];
	durationInSeconds?: number;
}) {
	if (result.segments.length > 0) return result.segments;

	return [
		{
			text: result.text,
			startSecond: 0,
			endSecond: result.durationInSeconds ?? 0,
		},
	];
}

export async function transcribeAudio(key: string) {
	const parts = normalizeKey(key).split(":");
	const [id, folder, filename] = parts;
	const match = filename?.match(/^(\d+)\.mp3$/);

	if (!id || parts.length !== 3 || folder !== "audios" || !match?.[1])
		throw new Error(`Expected <id>/audios/<number>.mp3, received: ${key}`);

	const number = match[1];

	const audio = await mediaStorage.getItemRaw<Uint8Array>(
		`${id}/audios/${number}.mp3`,
	);
	if (!audio) throw new Error(`Missing media object: ${key}`);

	const result = await transcribe({
		model: openrouter.transcription("google/gemini-3.5-transcribe"),
		audio,
	});

	const segments = toSegments(result);

	const outputKey = mediaKey(id, `transcript-single/${Number(number)}.json`);

	await mediaStorage.setItem(outputKey, JSON.stringify(segments, null, 2));

	return {
		inputKey: key,
		outputKey,
		segments,
	};
}

export async function transcribeAudioChunk(key: string) {
	const parts = normalizeKey(key).split(":");
	const [id, folder, number, filename] = parts;
	const match = filename?.match(CHUNK_FILE);

	if (
		!id ||
		parts.length !== 4 ||
		folder !== "audio-chunks" ||
		!number ||
		!match?.[1]
	)
		throw new Error(
			`Expected <id>/audio-chunks/<number>/<number>_audio_<index>.aac, received: ${key}`,
		);

	const index = Number(match[2]);

	const audio = await mediaStorage.getItemRaw<Uint8Array>(normalizeKey(key));
	if (!audio) throw new Error(`Missing media object: ${key}`);

	const result = await transcribe({
		model: openrouter.transcription("google/gemini-3.5-transcribe"),
		audio,
	});

	const segments = toSegments(result);

	const outputKey = mediaKey(
		id,
		`transcript-chunks/${Number(number)}/${index}.json`,
	);

	await mediaStorage.setItem(outputKey, JSON.stringify(segments, null, 2));

	return {
		inputKey: key,
		outputKey,
		segments,
	};
}
