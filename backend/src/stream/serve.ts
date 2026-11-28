import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { bucket } from "@/aws/bucket";
import { MEDIA_BUCKET } from "@/aws/config";
import { isNotFound } from "./bucket";

export type StreamVideoMeta = {
	contentType: string;
	size: number;
};

export type ByteRange = {
	start: number;
	end: number;
};

type ParsedByteRange = ByteRange | { unsatisfiable: true };

export function streamContentType(key: string) {
	if (key.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
	if (key.endsWith(".ts")) return "video/mp2t";
	if (key.endsWith(".mp4")) return "video/mp4";
	return "application/octet-stream";
}

export async function getStreamVideoMeta(
	key: string,
): Promise<StreamVideoMeta | null> {
	try {
		const res = await bucket.send(
			new HeadObjectCommand({ Bucket: MEDIA_BUCKET, Key: key }),
		);

		return {
			contentType: streamContentType(key),
			size: res.ContentLength ?? 0,
		};
	} catch (error) {
		if (isNotFound(error)) return null;
		throw error;
	}
}

export function parseByteRange(
	header: string | undefined,
	size: number,
): ParsedByteRange | null {
	if (!header) return null;

	const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
	if (!match || (!match[1] && !match[2])) return { unsatisfiable: true };

	let start: number;
	let end: number;

	if (!match[1]) {
		const suffix = Number(match[2]);
		if (!Number.isFinite(suffix) || suffix <= 0) {
			return { unsatisfiable: true };
		}

		start = Math.max(0, size - suffix);
		end = size - 1;
	} else {
		start = Number(match[1]);
		end = match[2] ? Number(match[2]) : size - 1;

		if (!Number.isFinite(start) || !Number.isFinite(end)) {
			return { unsatisfiable: true };
		}

		end = Math.min(end, size - 1);
	}

	if (size <= 0 || start >= size || end < start) {
		return { unsatisfiable: true };
	}

	return { start, end };
}

export async function getStreamVideoStream(
	key: string,
	range: ByteRange | null,
) {
	const res = await bucket.send(
		new GetObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: key,
			Range: range ? `bytes=${range.start}-${range.end}` : undefined,
		}),
	);

	if (!res.Body) throw new Error(`Stream video has no body: ${key}`);

	return res.Body.transformToWebStream() as ReadableStream<Uint8Array>;
}
