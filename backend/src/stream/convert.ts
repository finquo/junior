import {
	AudioDefaultSelection,
	HlsOutputSelection,
	HlsStreamInfResolution,
	type Output,
} from "@aws-sdk/client-mediaconvert";
import { createJob } from "@/aws/convert";
import { getCourseVideoBucketURL } from "./bucket";
import {
	COURSE_VIDEO_RESOLUTION_KEYS,
	COURSE_VIDEO_RESOLUTIONS,
} from "./config";

export function createCourseVideoConvertJob({
	videoId,
	sourceKey,
}: {
	videoId: string;
	sourceKey: string;
}) {
	const outputs: Output[] = COURSE_VIDEO_RESOLUTION_KEYS.map((resolution) => {
		const { width, height, bitrate } = COURSE_VIDEO_RESOLUTIONS[resolution];

		return {
			NameModifier: `_${resolution}`,
			ContainerSettings: { Container: "M3U8" },
			VideoDescription: {
				Width: width,
				Height: height,
				ScalingBehavior: "DEFAULT",
				CodecSettings: {
					Codec: "H_264",
					H264Settings: {
						Bitrate: bitrate,
						RateControlMode: "CBR",
					},
				},
			},
			AudioDescriptions: [
				{
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
		};
	});

	return createJob({
		Inputs: [
			{
				FileInput: getCourseVideoBucketURL(sourceKey),
				AudioSelectors: {
					"Audio Selector 1": {
						DefaultSelection: AudioDefaultSelection.DEFAULT,
					},
				},
			},
		],
		OutputGroups: [
			{
				Name: "CourseVideoHls",
				OutputGroupSettings: {
					Type: "HLS_GROUP_SETTINGS",
					HlsGroupSettings: {
						Destination: getCourseVideoBucketURL(
							`course/${videoId}/hls/master`,
						),
						OutputSelection: HlsOutputSelection.MANIFESTS_AND_SEGMENTS,
						SegmentLength: 6,
						MinSegmentLength: 2,
						StreamInfResolution: HlsStreamInfResolution.INCLUDE,
					},
				},
				Outputs: outputs,
			},
		],
	});
}
