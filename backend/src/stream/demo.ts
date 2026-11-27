import { GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { bucket } from "@/aws/bucket";
import { MEDIA_BUCKET } from "@/aws/config";
import { courseVideoSourceKey } from "./bucket";

export const DEMO_VIDEO_ID = "demo";
export const DEMO_VIDEO_KEY = courseVideoSourceKey(DEMO_VIDEO_ID);

export type DemoVideoMeta = {
	contentType: string;
	size: number;
};

export type DemoVideoRange = {
	start: number;
	end: number;
};

type ParsedDemoVideoRange = DemoVideoRange | { unsatisfiable: true };

export async function getDemoVideoMeta(): Promise<DemoVideoMeta> {
	const res = await bucket.send(
		new HeadObjectCommand({ Bucket: MEDIA_BUCKET, Key: DEMO_VIDEO_KEY }),
	);

	return {
		contentType: res.ContentType ?? "video/mp4",
		size: res.ContentLength ?? 0,
	};
}

export function parseDemoVideoRange(
	header: string | undefined,
	size: number,
): ParsedDemoVideoRange | null {
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

export async function getDemoVideoStream(range: DemoVideoRange | null) {
	const res = await bucket.send(
		new GetObjectCommand({
			Bucket: MEDIA_BUCKET,
			Key: DEMO_VIDEO_KEY,
			Range: range ? `bytes=${range.start}-${range.end}` : undefined,
		}),
	);

	if (!res.Body) throw new Error("Demo video has no body");

	return res.Body.transformToWebStream() as ReadableStream<Uint8Array>;
}
