import { z } from "zod";

export const COURSE_VIDEO_RESOLUTIONS = {
	"1080p": { width: 1920, height: 1080, bitrate: 5_000_000 },
	"720p": { width: 1280, height: 720, bitrate: 2_500_000 },
	"480p": { width: 854, height: 480, bitrate: 1_000_000 },
	"360p": { width: 640, height: 360, bitrate: 600_000 },
} as const;

export type CourseVideoResolution = keyof typeof COURSE_VIDEO_RESOLUTIONS;

export const COURSE_VIDEO_RESOLUTION_KEYS = Object.keys(
	COURSE_VIDEO_RESOLUTIONS,
) as CourseVideoResolution[];

export const courseVideoFilePathSchema = z
	.string()
	.min(1)
	.regex(/^[A-Za-z0-9._/-]+$/)
	.refine((path) => !path.split("/").includes(".."), "Invalid file path");

export function getCourseVideoFileUrl(videoId: string, path: string) {
	if (path === "source/video.mp4") return `/api/stream/${videoId}`;

	const hlsFile = /^hls\/(.+)$/.exec(path);
	if (hlsFile?.[1]) {
		return `/api/stream/${videoId}/hls/${hlsFile[1]}`;
	}

	return null;
}
