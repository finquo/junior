import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { transcribe } from "ai";
import { sarvam } from "sarvam-ai-sdk";
import { bucket } from "./bucket";

export async function transcribeS3Object(bucketName: string, key: string) {
	const object = await bucket.send(
		new GetObjectCommand({ Bucket: bucketName, Key: key }),
	);

	const audio = new Uint8Array(await object.Body!.transformToByteArray());

	const { text } = await transcribe({
		model: sarvam.transcription("saaras:v4", "unknown", {
			mode: "transcribe",
		}),
		audio,
	});

	const outputKey = `transcripts/${key}.json`;

	await bucket.send(
		new PutObjectCommand({
			Bucket: bucketName,
			Key: outputKey,
			Body: JSON.stringify(
				{
					inputKey: key,
					transcript: text,
					createdAt: new Date().toISOString(),
				},
				null,
				2,
			),
			ContentType: "application/json",
		}),
	);

	return {
		inputKey: key,
		outputKey,
		transcript: text,
	};
}
