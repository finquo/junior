import {
	CreateJobCommand,
	type CreateJobCommandInput,
	MediaConvertClient,
} from "@aws-sdk/client-mediaconvert";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createStorage } from "unstorage";
import { bucket } from "./bucket";
import {
	AWS_REGION,
	MEDIA_BUCKET,
	MEDIA_CONVERT_ENDPOINT,
	MEDIA_CONVERT_QUEUE_ARN,
	MEDIA_CONVERT_ROLE_ARN,
} from "./config";
import { s3Driver, toS3Path } from "./s3-driver";

const CHUNK_LENGTH_SECONDS = 120;

/**
	Media lives under its own prefix so the bucket can also host the
	CloudFront static assets (uploaded to `_assets/`) without key collisions.
*/
const MEDIA_PREFIX = "media";

const mediaPath = (key: string) => `${MEDIA_PREFIX}/${toS3Path(key)}`;

export const getMediaBucketURL = (key: string) => {
	const isPrefix = /[/\\:]$/.test(key);
	return `s3://${MEDIA_BUCKET}/${mediaPath(key)}${isPrefix ? "/" : ""}`;
};

export const mediaStorage = createStorage({
	driver: s3Driver({ bucket: MEDIA_BUCKET, prefix: MEDIA_PREFIX }),
});

export function getMediaDownloadURL(key: string, expiresIn = 3600) {
	return getSignedUrl(
		bucket,
		new GetObjectCommand({ Bucket: MEDIA_BUCKET, Key: mediaPath(key) }),
		{ expiresIn },
	);
}

const mediaConvert = new MediaConvertClient({
	region: AWS_REGION,
	endpoint: MEDIA_CONVERT_ENDPOINT,
});

async function createJob(settings: CreateJobCommandInput["Settings"]) {
	const { Job } = await mediaConvert.send(
		new CreateJobCommand({
			Role: MEDIA_CONVERT_ROLE_ARN,
			Queue: MEDIA_CONVERT_QUEUE_ARN,
			Settings: settings,
		}),
	);

	return { jobId: Job?.Id, status: Job?.Status };
}

export function createToAudioJob({ id }: { id: string }) {
	return createJob({
		Inputs: [
			{
				FileInput: getMediaBucketURL(`${id}/video.mp4`),
				AudioSelectors: {
					"Audio Selector 1": {
						SelectorType: "TRACK",
						Tracks: [1],
					},
				},
			},
		],
		OutputGroups: [
			{
				Name: "Audio",
				OutputGroupSettings: {
					Type: "FILE_GROUP_SETTINGS",
					FileGroupSettings: {
						Destination: getMediaBucketURL(`${id}/audio`),
					},
				},
				Outputs: [
					{
						Extension: "mp3",
						ContainerSettings: { Container: "RAW" },
						AudioDescriptions: [
							{
								AudioSourceName: "Audio Selector 1",
								CodecSettings: {
									Codec: "MP3",
									Mp3Settings: {
										Bitrate: 128000,
										Channels: 1,
										SampleRate: 48000,
										RateControlMode: "CBR",
									},
								},
							},
						],
					},
				],
			},
		],
	});
}

export function createSplitAudioJob({ id }: { id: string }) {
	return createJob({
		Inputs: [
			{
				FileInput: getMediaBucketURL(`${id}/audio.mp3`),
				AudioSelectors: {
					"Audio Selector 1": {
						SelectorType: "TRACK",
						Tracks: [1],
					},
				},
			},
		],
		OutputGroups: [
			{
				Name: "AudioChunks",
				OutputGroupSettings: {
					Type: "HLS_GROUP_SETTINGS",
					HlsGroupSettings: {
						Destination: getMediaBucketURL(`${id}/chunks/`),
						SegmentLength: CHUNK_LENGTH_SECONDS,
						MinSegmentLength: CHUNK_LENGTH_SECONDS,
						SegmentControl: "SEGMENTED_FILES",
					},
				},
				Outputs: [
					{
						ContainerSettings: { Container: "M3U8" },
						AudioDescriptions: [
							{
								AudioSourceName: "Audio Selector 1",
								CodecSettings: {
									Codec: "AAC",
									AacSettings: {
										Bitrate: 128000,
										CodingMode: "CODING_MODE_2_0",
										SampleRate: 48000,
									},
								},
							},
						],
					},
				],
			},
		],
	});
}
