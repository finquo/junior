import { transcribe } from "ai";
import { sarvam } from "sarvam-ai-sdk";
import { normalizeKey } from "unstorage";
import { mediaStorage } from "../aws/media";

export async function transcribeAudio(key: string) {
	const parts = normalizeKey(key).split(":");
	const [id, filename] = parts;

	if (!id || parts.length !== 2 || filename !== "audio.mp3")
		throw new Error(`Expected <id>/audio.mp3, received: ${key}`);

	const audio = await mediaStorage.getItemRaw<Uint8Array>(`${id}/audio.mp3`);
	if (!audio) throw new Error(`Missing media object: ${key}`);

	const { segments } = await transcribe({
		model: sarvam.transcription("saaras:v4", "unknown", {
			mode: "transcribe",
			with_timestamps: true,
		}),
		audio,
	});

	const outputKey = `${id}/transcript/main.json`;

	await mediaStorage.setItem(outputKey, JSON.stringify(segments, null, 2));

	return {
		inputKey: key,
		outputKey,
		segments,
	};
}

export async function transcribeAudioChunk(key: string) {
	const parts = normalizeKey(key).split(":");
	const [id, folder, filename] = parts;
	const match = filename?.match(/^audio_(\d+)\.[^.]+$/);

	if (!id || parts.length !== 3 || folder !== "chunks" || !match?.[1])
		throw new Error(
			`Expected <id>/chunks/audio_<number>.<ext>, received: ${key}`,
		);

	const number = match[1];

	const audio = await mediaStorage.getItemRaw<Uint8Array>(normalizeKey(key));
	if (!audio) throw new Error(`Missing media object: ${key}`);

	const { segments } = await transcribe({
		model: sarvam.transcription("saaras:v4", "unknown", {
			mode: "transcribe",
			with_timestamps: true,
		}),
		audio,
	});

	const outputKey = `${id}/transcript/chunks/${number}.json`;

	await mediaStorage.setItem(outputKey, JSON.stringify(segments, null, 2));

	return {
		inputKey: key,
		outputKey,
		segments,
	};
}
