import { createJob } from "@/aws/convert";
import { getCourseVideoBucketURL } from "./bucket";
import { COURSE_VIDEO_RESOLUTIONS, type CourseVideoResolution } from "./config";

export function createCourseVideoConvertJob({
	videoId,
	resolution,
	sourceKey,
}: {
	videoId: string;
	resolution: CourseVideoResolution;
	sourceKey: string;
}) {
	const { width, height, bitrate } = COURSE_VIDEO_RESOLUTIONS[resolution];

	return createJob({
		Inputs: [{ FileInput: getCourseVideoBucketURL(sourceKey) }],
		OutputGroups: [
			{
				Name: "CourseVideo",
				OutputGroupSettings: {
					Type: "FILE_GROUP_SETTINGS",
					FileGroupSettings: {
						Destination: getCourseVideoBucketURL(
							`course/${videoId}/${resolution}/video`,
						),
					},
				},
				Outputs: [
					{
						Extension: "mp4",
						ContainerSettings: {
							Container: "MP4",
							Mp4Settings: {
								MoovPlacement: "PROGRESSIVE_DOWNLOAD",
							},
						},
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
					},
				],
			},
		],
	});
}
