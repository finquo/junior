import {
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createStorage } from "unstorage";
import { bucket } from "./bucket";
import { MEDIA_BUCKET } from "./config";
import { s3Driver, toS3Path } from "./s3-driver";

export const CHUNK_LENGTH_SECONDS = 20 * 60;

export const CHUNK_FILE = /(\d+)_audio_(\d+)\.aac$/;

type MediaLayout = {
	videos: `${number}.mp4`;
	audios: `${number}.mp3`;
	"audio-chunks": `${number}/${number}_audio_${number}.aac`;
	"transcript-single": `${number}.json`;
	"transcript-chunks": `${number}/${number}.json`;
	transcript: `${number}.json`;
	summary: "main.json" | "chunks.json";
};

type MediaFolder = keyof MediaLayout;

type MediaPath<F extends MediaFolder = MediaFolder> = `${F}/${MediaLayout[F]}`;

type MediaDir<F extends MediaFolder = MediaFolder> = `${F}/${number}`;

type MediaKey<F extends MediaFolder = MediaFolder> =
	`${string}/${MediaPath<F>}`;

export const mediaKey = <F extends MediaFolder>(
	id: string,
	path: MediaPath<F>,
) => `${id}/${path}` as MediaKey<F>;

export const mediaDir = <F extends MediaFolder>(id: string, dir: MediaDir<F>) =>
	`${id}/${dir}`;

export const ALLOWED_ASSET_PATHS = [
	/^videos\/\d+\.mp4$/,
	/^audios\/\d+\.mp3$/,
	/^audio-chunks\/\d+\/\d+\.m3u8$/,
	/^audio-chunks\/\d+\/\d+_audio\.m3u8$/,
	/^audio-chunks\/\d+\/\d+_audio_\d+\.aac$/,
	/^transcript-single\/\d+\.json$/,
	/^transcript-chunks\/\d+\/\d+\.json$/,
	/^transcript\/\d+\.json$/,
	/^summary\/main\.json$/,
	/^summary\/chunks\.json$/,
] satisfies RegExp[];

export const isAllowedAssetPath = (path: string) =>
	ALLOWED_ASSET_PATHS.some((pattern) => pattern.test(path));

export const normalizeMediaKey = (key: string) => key.replace(/:/g, "/");

export const toMediaPath = (id: string, key: string) => {
	const normalized = normalizeMediaKey(key);
	return normalized.startsWith(`${id}/`)
		? normalized.slice(id.length + 1)
		: normalized;
};

export const byNumber = (a: string, b: string) =>
	(Number(a.match(/(\d+)\.json$/)?.[1]) || 0) -
	(Number(b.match(/(\d+)\.json$/)?.[1]) || 0);

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

export async function listMediaFiles(id: string) {
	const objects: { key: string; lastModified: number }[] = [];
	let token: string | undefined;

	do {
		const res = await bucket.send(
			new ListObjectsV2Command({
				Bucket: MEDIA_BUCKET,
				Prefix: `${MEDIA_PREFIX}/${id}/`,
				ContinuationToken: token,
			}),
		);

		for (const item of res.Contents ?? []) {
			if (!item.Key || !item.LastModified) continue;

			objects.push({
				key: item.Key.slice(MEDIA_PREFIX.length + 1),
				lastModified: item.LastModified.getTime(),
			});
		}

		token = res.NextContinuationToken;
	} while (token);

	return objects
		.sort((a, b) => a.lastModified - b.lastModified)
		.map((object) => object.key);
}

type MediaArtifact = {
	path: string;
	size: number | null;
};

export async function getMediaMeta(key: string) {
	const meta = await mediaStorage.getMeta(key);
	return meta.size === undefined ? null : { size: Number(meta.size) };
}

export async function getMediaArtifact(
	id: string,
	path: string,
): Promise<MediaArtifact | null> {
	const meta = await getMediaMeta(`${id}/${path}`);
	if (!meta) return null;

	return {
		path,
		size: meta.size || null,
	};
}

const CONTENT_TYPES: Record<string, string> = {
	mp4: "video/mp4",
	mp3: "audio/mpeg",
	aac: "audio/aac",
	json: "application/json",
	m3u8: "application/vnd.apple.mpegurl",
};

export function getMediaViewURL(key: string, expiresIn = 3600) {
	const extension = key.split(".").pop() ?? "";
	const filename = key.split("/").pop();
	return getSignedUrl(
		bucket,
		new GetObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: mediaPath(key),
			ResponseContentType: CONTENT_TYPES[extension],
			ResponseContentDisposition: `inline; filename="${filename}"`,
		}),
		{ expiresIn },
	);
}

const ZOOM_FILE_ID_META = "zoom-file-id";

const VIDEO_KEY = /\/videos\/\d+\.mp4$/;

export async function saveZoomVideo(
	key: string,
	body: Uint8Array,
	zoomFileId: string,
) {
	await bucket.send(
		new PutObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: mediaPath(key),
			Body: body,
			Metadata: { [ZOOM_FILE_ID_META]: zoomFileId },
		}),
	);
}

export async function hasZoomVideo(sessionName: string, zoomFileId: string) {
	const keys = await mediaStorage.getKeys(sessionName);

	for (const key of keys) {
		if (!VIDEO_KEY.test(normalizeMediaKey(key))) continue;

		const res = await bucket.send(
			new HeadObjectCommand({ Bucket: MEDIA_BUCKET, Key: mediaPath(key) }),
		);

		if (res.Metadata?.[ZOOM_FILE_ID_META] === zoomFileId) return true;
	}

	return false;
}

const VIDEO_FILE = /^(\d+)\.mp4$/;

export function nextVideoIndex(keys: string[], sessionName: string) {
	const prefix = `${sessionName}/videos/`;

	const indexes = keys
		.map((key) => key.replace(/:/g, "/"))
		.filter((key) => key.startsWith(prefix))
		.flatMap((key) => {
			const match = VIDEO_FILE.exec(key.slice(prefix.length));
			return match ? [Number(match[1])] : [];
		});

	return indexes.length === 0 ? 0 : Math.max(...indexes) + 1;
}

export function getMediaDownloadURL(
	key: string,
	expiresIn = 3600,
	filename?: string,
) {
	return getSignedUrl(
		bucket,
		new GetObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: mediaPath(key),
			ResponseContentDisposition: filename
				? `attachment; filename="${filename}"`
				: undefined,
		}),
		{ expiresIn },
	);
}
