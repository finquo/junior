// import { transcribeAudio, transcribeAudioChunk } from "@/ai/transcribe";

export type S3Event = {
	Records: {
		s3: {
			bucket: { name: string };
			object: { key: string };
		};
	}[];
};

export const handleMediaEvent = async (event: S3Event) => {
	for (const record of event.Records) {
		console.log("[event-media]", record.s3.bucket.name, record.s3.object.key);

		// const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

		// if (/\/audio-chunks\/\d+\/\d+_audio_\d+\.aac$/.test(key))
		// 	return transcribeAudioChunk(key);

		// return transcribeAudio(key);
	}
};
