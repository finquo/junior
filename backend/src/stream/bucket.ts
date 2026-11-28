import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { bucket } from "@/aws/bucket";
import { MEDIA_BUCKET } from "@/aws/config";

export const courseVideoKey = (videoId: string, path: string) =>
	`course/${videoId}/${path}` as const;

export const COURSE_VIDEO_SOURCE_KEY =
	/^course\/([A-Za-z0-9_-]+)\/source\/video\.mp4$/;

export const courseVideoSourceKey = (videoId: string) =>
	courseVideoKey(videoId, "source/video.mp4");

export const courseVideoHlsKey = (videoId: string) =>
	courseVideoKey(videoId, "hls/master.m3u8");

export const courseVideoHlsFileKey = (videoId: string, file: string) =>
	courseVideoKey(videoId, `hls/${file}`);

export const getCourseVideoBucketURL = (key: string) =>
	`s3://${MEDIA_BUCKET}/${key}`;

export function isNotFound(error: unknown) {
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

export async function getCourseVideoMeta(key: string) {
	try {
		const res = await bucket.send(
			new HeadObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }),
		);
		return {
			size: res.ContentLength ?? null,
			lastModified: res.LastModified?.getTime() ?? null,
		};
	} catch (error) {
		if (isNotFound(error)) return null;
		throw error;
	}
}

export async function listCourseVideos() {
	const sources = new Map<
		string,
		{ key: string; size: number | null; lastModified: number | null }
	>();
	let token: string | undefined;

	do {
		const res = await bucket.send(
			new ListObjectsV2Command({
				Bucket: MEDIA_BUCKET,
				Prefix: "course/",
				ContinuationToken: token,
			}),
		);

		for (const item of res.Contents ?? []) {
			if (!item.Key) continue;

			const match = /^course\/([^/]+)\/source\/video\.mp4$/.exec(item.Key);
			if (!match?.[1]) continue;

			sources.set(match[1], {
				key: item.Key,
				size: item.Size ?? null,
				lastModified: item.LastModified?.getTime() ?? null,
			});
		}

		token = res.NextContinuationToken;
	} while (token);

	const videos = await Promise.all(
		[...sources].map(async ([videoId, source]) => {
			const hlsKey = courseVideoHlsKey(videoId);
			const hls = await getCourseVideoMeta(hlsKey);

			return {
				videoId,
				source,
				hls: hls ? { key: hlsKey, ...hls } : null,
			};
		}),
	);

	return videos.sort((a, b) => a.videoId.localeCompare(b.videoId));
}

const fileRank = (path: string) => {
	if (path === "source/video.mp4") return 0;
	if (path === "hls/master.m3u8") return 1;
	if (path.startsWith("hls/") && path.endsWith(".m3u8")) return 2;
	if (path.startsWith("hls/")) return 3;
	return 4;
};

export async function listCourseVideoFiles(videoId: string) {
	const prefix = `course/${videoId}/`;
	const files: {
		path: string;
		size: number | null;
		lastModified: number | null;
	}[] = [];
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
			if (!item.Key?.startsWith(prefix)) continue;

			const path = item.Key.slice(prefix.length);
			if (!path) continue;

			files.push({
				path,
				size: item.Size ?? null,
				lastModified: item.LastModified?.getTime() ?? null,
			});
		}

		token = res.NextContinuationToken;
	} while (token);

	return files.sort(
		(a, b) =>
			fileRank(a.path) - fileRank(b.path) || a.path.localeCompare(b.path),
	);
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

export function getCourseVideoDownloadURL(key: string, expiresIn = 3600) {
	const filename = key.split("/").pop() ?? "video.mp4";

	return getSignedUrl(
		bucket,
		new GetObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: key,
			ResponseContentType: "application/octet-stream",
			ResponseContentDisposition: `attachment; filename="${filename}"`,
		}),
		{ expiresIn },
	);
}

export async function deleteCourseVideoFile(key: string) {
	await bucket.send(
		new DeleteObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: key,
		}),
	);
}
