import {
	CreateJobCommand,
	type CreateJobCommandInput,
	MediaConvertClient,
} from "@aws-sdk/client-mediaconvert";
import {
	AWS_REGION,
	MEDIA_CONVERT_ENDPOINT,
	MEDIA_CONVERT_QUEUE_ARN,
	MEDIA_CONVERT_ROLE_ARN,
} from "./config";
import {
	CHUNK_LENGTH_SECONDS,
	getMediaBucketURL,
	mediaDir,
	mediaKey,
} from "./media";

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

export function createToAudioJob({
	id,
	index = 0,
}: {
	id: string;
	index?: number;
}) {
	return createJob({
		Inputs: [
			{
				FileInput: getMediaBucketURL(mediaKey(id, `videos/${index}.mp4`)),
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
						Destination: getMediaBucketURL(mediaDir(id, `audios/${index}`)),
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

export function createSplitAudioJob({
	id,
	index = 0,
}: {
	id: string;
	index?: number;
}) {
	return createJob({
		Inputs: [
			{
				FileInput: getMediaBucketURL(mediaKey(id, `audios/${index}.mp3`)),
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
						Destination: getMediaBucketURL(
							`${mediaDir(id, `audio-chunks/${index}`)}/`,
						),
						SegmentLength: CHUNK_LENGTH_SECONDS,
						MinSegmentLength: 1,
						SegmentControl: "SEGMENTED_FILES",
					},
				},
				Outputs: [
					{
						NameModifier: "_audio",
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
