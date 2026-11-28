import { COURSE_VIDEO_SOURCE_KEY, courseVideoSourceKey } from "@/stream/bucket";
import { createCourseVideoConvertJob } from "@/stream/convert";

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
		const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
		const match = COURSE_VIDEO_SOURCE_KEY.exec(key);

		if (!match?.[1]) continue;

		const videoId = match[1];

		await createCourseVideoConvertJob({
			videoId,
			sourceKey: courseVideoSourceKey(videoId),
		});
	}
};
