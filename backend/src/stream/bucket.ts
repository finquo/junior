import {
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { bucket } from "@/aws/bucket";
import { MEDIA_BUCKET } from "@/aws/config";
import {
	COURSE_VIDEO_RESOLUTION_KEYS,
	type CourseVideoResolution,
} from "./config";

export type CourseVideoJobMarker = {
	jobId: string;
	sourceKey: string;
	createdAt: string;
};

export const courseVideoKey = (videoId: string, path: string) =>
	`course/${videoId}/${path}`;

export const courseVideoSourceKey = (videoId: string) =>
	courseVideoKey(videoId, "source/video.mp4");

export const courseVideoRenditionKey = (
	videoId: string,
	resolution: CourseVideoResolution,
) => courseVideoKey(videoId, `${resolution}/video.mp4`);

export const courseVideoJobKey = (
	videoId: string,
	resolution: CourseVideoResolution,
) => courseVideoKey(videoId, `jobs/${resolution}.json`);

export const getCourseVideoBucketURL = (key: string) =>
	`s3://${MEDIA_BUCKET}/${key}`;

function isNotFound(error: unknown) {
	const err = error as {
		name?: string;
		$metadata?: { httpStatusCode?: number };
	};

	return (
		err?.name === "NotFound" ||
		err?.name === "NoSuchKey" ||
		err?.$metadata?.httpStatusCode === 404
	);
}

export async function courseVideoExists(key: string) {
	try {
		await bucket.send(
			new HeadObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }),
		);
		return true;
	} catch (error) {
		if (isNotFound(error)) return false;
		throw error;
	}
}

export async function getCourseVideoMeta(key: string) {
	try {
		const res = await bucket.send(
			new HeadObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }),
		);
		return { size: res.ContentLength ?? null };
	} catch (error) {
		if (isNotFound(error)) return null;
		throw error;
	}
}

export async function listCourseVideoResolutions(videoId: string) {
	const prefix = `course/${videoId}/`;
	const resolutions = new Set<CourseVideoResolution>();
	let token: string | undefined;

	do {
		const res = await bucket.send(
			new ListObjectsV2Command({
				Bucket: MEDIA_BUCKET,
				Prefix: prefix,
				ContinuationToken: token,
			}),
		);

		for (const item of res.Contents ?? []) {
			if (!item.Key) continue;

			const relative = item.Key.slice(prefix.length);
			const match = /^([^/]+)\/video\.mp4$/.exec(relative);
			const resolution = match?.[1];

			if (
				resolution &&
				COURSE_VIDEO_RESOLUTION_KEYS.includes(
					resolution as CourseVideoResolution,
				)
			) {
				resolutions.add(resolution as CourseVideoResolution);
			}
		}

		token = res.NextContinuationToken;
	} while (token);

	return [...resolutions];
}

export function createCourseVideoUploadURL({
	key,
	contentType,
	expiresIn = 3600,
}: {
	key: string;
	contentType: string;
	expiresIn?: number;
}) {
	return getSignedUrl(
		bucket,
		new PutObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: key,
			ContentType: contentType,
		}),
		{ expiresIn },
	);
}

export function getCourseVideoStreamURL(key: string, expiresIn = 3600) {
	const filename = key.split("/").pop() ?? "video.mp4";

	return getSignedUrl(
		bucket,
		new GetObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: key,
			ResponseContentType: "video/mp4",
			ResponseContentDisposition: `inline; filename="${filename}"`,
		}),
		{ expiresIn },
	);
}

export async function writeCourseVideoJobMarker(
	videoId: string,
	resolution: CourseVideoResolution,
	marker: CourseVideoJobMarker,
) {
	await bucket.send(
		new PutObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: courseVideoJobKey(videoId, resolution),
			Body: JSON.stringify(marker),
			ContentType: "application/json",
		}),
	);
}

export async function readCourseVideoJobMarker(
	videoId: string,
	resolution: CourseVideoResolution,
) {
	try {
		const res = await bucket.send(
			new GetObjectCommand({
				Bucket: MEDIA_BUCKET,
				Key: courseVideoJobKey(videoId, resolution),
			}),
		);

		const body = await res.Body?.transformToString();
		if (!body) return null;
		return JSON.parse(body) as CourseVideoJobMarker;
	} catch (error) {
		if (isNotFound(error)) return null;
		throw error;
	}
}
