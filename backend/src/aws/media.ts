import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createStorage } from "unstorage";
import { bucket } from "./bucket";
import { MEDIA_BUCKET } from "./config";
import { s3Driver, toS3Path } from "./s3-driver";

export const CHUNK_LENGTH_SECONDS = 25;

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
