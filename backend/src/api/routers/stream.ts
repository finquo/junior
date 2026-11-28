import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import {
	courseVideoKey,
	courseVideoSourceKey,
	createCourseVideoUploadURL,
	deleteCourseVideoFile,
	getCourseVideoDownloadURL,
	getCourseVideoMeta,
	listCourseVideoFiles,
	listCourseVideos,
} from "@/stream/bucket";
import { courseVideoFilePathSchema } from "@/stream/config";

const videoId = z
	.string()
	.min(1)
	.regex(/^[A-Za-z0-9_-]+$/);

const editorRoles = ["admin", "scheduler"] as const;

export const streamRouter = {
	list: getRolesProcedure(["admin", "scheduler", "qa_auditor"]).handler(
		async () =>
			getAPI("aws-s3-list-course-video-library", listCourseVideos(), []),
	),

	files: getRolesProcedure(["admin", "scheduler", "qa_auditor"])
		.input(z.object({ videoId }))
		.handler(async ({ input }) =>
			getAPI(
				"aws-s3-list-course-video-library-files",
				listCourseVideoFiles(input.videoId),
				[],
			),
		),

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

	downloadUrl: getRolesProcedure(editorRoles)
		.input(z.object({ videoId, path: courseVideoFilePathSchema }))
		.handler(async ({ input }) => {
			const key = courseVideoKey(input.videoId, input.path);
			const meta = await getAPI(
				"aws-s3-course-video-file-meta",
				getCourseVideoMeta(key),
				null,
			);

			if (!meta) {
				throw getError(
					"NOT_FOUND",
					`Course video file not found: ${input.path}`,
				);
			}

			return {
				url: await tryAPI(
					"aws-s3-presign-course-video-download",
					getCourseVideoDownloadURL(key),
				),
			};
		}),

	delete: getRolesProcedure(editorRoles)
		.input(z.object({ videoId, path: courseVideoFilePathSchema }))
		.handler(async ({ input }) => {
			await tryAPI(
				"aws-s3-delete-course-video-file",
				deleteCourseVideoFile(courseVideoKey(input.videoId, input.path)),
			);

			return { success: true };
		}),
};
