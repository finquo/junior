import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import {
	type CourseVideoJobMarker,
	courseVideoExists,
	courseVideoRenditionKey,
	courseVideoSourceKey,
	createCourseVideoUploadURL,
	getCourseVideoMeta,
	getCourseVideoStreamURL,
	listCourseVideoResolutions,
	readCourseVideoJobMarker,
	writeCourseVideoJobMarker,
} from "@/stream/bucket";
import {
	type CourseVideoResolution,
	courseVideoResolutionSchema,
	STALE_JOB_MS,
} from "@/stream/config";
import { createCourseVideoConvertJob } from "@/stream/convert";

const videoId = z
	.string()
	.min(1)
	.regex(/^[A-Za-z0-9_-]+$/);

const viewerRoles = [
	"admin",
	"scheduler",
	"teacher",
	"student",
	"qa_auditor",
] as const;

const editorRoles = ["admin", "scheduler"] as const;

export const streamRouter = {
	courseVideo: {
		uploadUrl: getRolesProcedure(editorRoles)
			.input(
				z.object({
					videoId,
					contentType: z.literal("video/mp4"),
				}),
			)
			.handler(async ({ input }) => {
				const key = courseVideoSourceKey(input.videoId);

				return {
					key,
					url: await tryAPI(
						"aws-s3-presign-course-video-upload",
						createCourseVideoUploadURL({
							key,
							contentType: input.contentType,
						}),
					),
				};
			}),

		resolutions: getRolesProcedure(viewerRoles)
			.input(z.object({ videoId }))
			.handler(async ({ input }) => {
				const [resolutions, source] = await Promise.all([
					getAPI<CourseVideoResolution[]>(
						"aws-s3-list-course-video-resolutions",
						listCourseVideoResolutions(input.videoId),
						[],
					),
					courseVideoExists(courseVideoSourceKey(input.videoId)),
				]);

				const items = await Promise.all(
					resolutions.map(async (resolution) => ({
						resolution,
						meta: await tryAPI(
							"aws-s3-course-video-resolution-meta",
							getCourseVideoMeta(
								courseVideoRenditionKey(input.videoId, resolution),
							),
						),
					})),
				);

				return {
					source,
					resolutions: items.map(({ resolution, meta }) => ({
						resolution,
						size: meta?.size ?? null,
					})),
				};
			}),

		ensureResolution: getRolesProcedure(editorRoles)
			.input(
				z.object({
					videoId,
					resolution: courseVideoResolutionSchema,
				}),
			)
			.handler(async ({ input }) => {
				const key = courseVideoRenditionKey(input.videoId, input.resolution);
				const meta = await courseVideoExists(key);

				if (meta) {
					return {
						status: "ready" as const,
						resolution: input.resolution,
						url: await tryAPI(
							"aws-s3-presign-course-video-stream",
							getCourseVideoStreamURL(key),
						),
					};
				}

				const sourceKey = courseVideoSourceKey(input.videoId);
				if (!(await courseVideoExists(sourceKey))) {
					throw getError(
						"NOT_FOUND",
						`Source video not found for ${input.videoId}`,
					);
				}

				const marker = await getAPI<CourseVideoJobMarker | null>(
					"aws-s3-read-course-video-job",
					readCourseVideoJobMarker(input.videoId, input.resolution),
					null,
				);

				if (
					marker &&
					Number.isFinite(Date.parse(marker.createdAt)) &&
					Date.now() - Date.parse(marker.createdAt) <= STALE_JOB_MS
				) {
					return {
						status: "processing" as const,
						resolution: input.resolution,
						jobId: marker.jobId,
					};
				}

				const job = await tryAPI(
					"aws-mediaconvert-course-video",
					createCourseVideoConvertJob({
						videoId: input.videoId,
						resolution: input.resolution,
						sourceKey,
					}),
				);

				if (!job?.jobId) {
					throw getError(
						"INTERNAL_SERVER_ERROR",
						"MediaConvert did not return a job",
					);
				}

				await tryAPI(
					"aws-s3-write-course-video-job",
					writeCourseVideoJobMarker(input.videoId, input.resolution, {
						jobId: job.jobId,
						sourceKey,
						createdAt: new Date().toISOString(),
					}),
				);

				return {
					status: "processing" as const,
					resolution: input.resolution,
					jobId: job.jobId,
				};
			}),

		stream: getRolesProcedure(viewerRoles)
			.input(
				z.object({
					videoId,
					resolution: courseVideoResolutionSchema,
				}),
			)
			.handler(async ({ input }) => {
				const key = courseVideoRenditionKey(input.videoId, input.resolution);
				const meta = await tryAPI(
					"aws-s3-course-video-stream-meta",
					getCourseVideoMeta(key),
				);

				if (!meta) {
					throw getError(
						"NOT_FOUND",
						`${input.resolution} video not found for ${input.videoId}`,
					);
				}

				return {
					url: await tryAPI(
						"aws-s3-presign-course-video-stream",
						getCourseVideoStreamURL(key),
					),
					size: meta.size,
				};
			}),
	},
};
