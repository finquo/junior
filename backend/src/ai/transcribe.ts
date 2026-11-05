import { transcribe } from "ai";
import { sarvam } from "sarvam-ai-sdk";
import { normalizeKey } from "unstorage";
import { mediaKey, mediaStorage } from "../aws/media";

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

	const { segments } = await transcribe({
		model: sarvam.transcription("saaras:v4", "unknown", {
			mode: "transcribe",
			with_timestamps: true,
		}),
		audio,
	});

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
	const match = filename?.match(/^audio_chunk_(\d{9})\.aac$/);

	if (
		!id ||
		parts.length !== 4 ||
		folder !== "audio-chunks" ||
		!number ||
		!match?.[1]
	)
		throw new Error(
			`Expected <id>/audio-chunks/<number>/audio_chunk_<index>.aac, received: ${key}`,
		);

	const index = Number(match[1]);

	const audio = await mediaStorage.getItemRaw<Uint8Array>(normalizeKey(key));
	if (!audio) throw new Error(`Missing media object: ${key}`);

	const { segments } = await transcribe({
		model: sarvam.transcription("saaras:v4", "unknown", {
			mode: "transcribe",
			with_timestamps: true,
		}),
		audio,
	});

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
