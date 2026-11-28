import { eq } from "drizzle-orm";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import {
	InsertVideoSchema,
	SelectVideoSchema,
	UpdateVideoSchema,
} from "@/db/zod";
import { db } from "@/services";

const readRoles = [
	"admin",
	"scheduler",
	"teacher",
	"enrollment_advisor",
	"qa_auditor",
	"financier",
] as const;

const writeRoles = ["admin", "scheduler"] as const;

/**
 * Order videos using the parent module's `videos` array.
 * Videos missing from the array keep their relative position at the end.
 */
export function orderVideos<T extends { id: string }>(
	videos: T[],
	order: string[],
) {
	const position = new Map(order.map((id, index) => [id, index]));
	return [...videos].sort(
		(a, b) =>
			(position.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
			(position.get(b.id) ?? Number.MAX_SAFE_INTEGER),
	);
}

export const videoRouter = {
	list: getRolesProcedure([...readRoles])
		.input(
			z.object({
				course: z.string(),
				module: z.string().optional(),
			}),
		)
		.handler(async ({ input }) => {
			const videos = await getAPI(
				"db-core-list-course-videos",
				db.query.video.findMany({
					where: {
						course: input.course,
						...(input.module ? { module: input.module } : {}),
					},
				}),
				[],
			);
			const modules = await getAPI(
				"db-core-list-course-video-modules",
				db.query.module.findMany({ where: { course: input.course } }),
				[],
			);

			let order: string[];
			if (input.module) {
				order =
					modules.find((module) => module.id === input.module)?.videos ?? [];
			} else {
				const course = await tryAPI(
					"db-core-list-course-videos-get-course",
					db.query.course.findFirst({ where: { id: input.course } }),
				);
				if (!course) throw getError("NOT_FOUND", "Course not found");

				const modulePosition = new Map(
					(course.modules ?? []).map((id, index) => [id, index]),
				);
				order = [...modules]
					.sort(
						(a, b) =>
							(modulePosition.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
							(modulePosition.get(b.id) ?? Number.MAX_SAFE_INTEGER),
					)
					.flatMap((module) => module.videos ?? []);
			}

			const moduleNames = new Map(
				modules.map((module) => [module.id, module.name]),
			);
			return orderVideos(videos, order).map((video) => ({
				...video,
				moduleName: video.module
					? (moduleNames.get(video.module) ?? null)
					: null,
			}));
		}),
	get: getRolesProcedure([...readRoles])
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const video = await tryAPI(
				"db-core-get-video",
				db.query.video.findFirst({
					where: { id: input.id },
					with: { courseInfo: true, moduleInfo: true },
				}),
			);
			if (!video) throw getError("NOT_FOUND", "Video not found");

			return {
				id: video.id,
				course: video.course,
				module: video.module,
				name: video.name,
				description: video.description,
				createdAt: video.createdAt,
				updatedAt: video.updatedAt,
				courseName: video.courseInfo?.name ?? "Unknown course",
				moduleName: video.moduleInfo?.name ?? "Unknown module",
			};
		}),
	create: getRolesProcedure([...writeRoles])
		.input(
			InsertVideoSchema.omit({
				id: true,
				createdAt: true,
				updatedAt: true,
			}).required({ course: true, module: true }),
		)
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-create-video",
				db.transaction(async (tx) => {
					const module = await tx.query.module.findFirst({
						where: { id: input.module },
					});
					if (!module || module.course !== input.course) {
						throw getError(
							"INPUT_VALIDATION_FAILED",
							"Video module must belong to this course",
						);
					}

					const [created] = await tx
						.insert(schema.video)
						.values({ ...input, id: crypto.randomUUID() })
						.returning();
					if (!created)
						throw getError("INTERNAL_SERVER_ERROR", "Failed to create video");

					await tx
						.update(schema.module)
						.set({ videos: [...(module.videos ?? []), created.id] })
						.where(eq(schema.module.id, input.module));

					return created;
				}),
			);
		}),
	update: getRolesProcedure([...writeRoles])
		.input(UpdateVideoSchema.required({ id: true }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-update-video",
				db
					.update(schema.video)
					.set(input)
					.where(eq(schema.video.id, input.id))
					.returning(),
			);
		}),
	delete: getRolesProcedure([...writeRoles])
		.input(SelectVideoSchema.pick({ id: true }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-delete-video",
				db.transaction(async (tx) => {
					const video = await tx.query.video.findFirst({
						where: { id: input.id },
					});
					if (!video) throw getError("NOT_FOUND", "Video not found");

					await tx.delete(schema.video).where(eq(schema.video.id, input.id));

					if (video.module) {
						const module = await tx.query.module.findFirst({
							where: { id: video.module },
						});
						if (module) {
							await tx
								.update(schema.module)
								.set({
									videos: (module.videos ?? []).filter(
										(videoId) => videoId !== input.id,
									),
								})
								.where(eq(schema.module.id, video.module));
						}
					}

					return video;
				}),
			);
		}),
	reorder: getRolesProcedure([...writeRoles])
		.input(z.object({ module: z.string(), videos: z.string().array() }))
		.handler(async ({ input }) => {
			return await tryAPI(
				"db-core-reorder-videos",
				db.transaction(async (tx) => {
					const module = await tx.query.module.findFirst({
						where: { id: input.module },
					});
					if (!module) throw getError("NOT_FOUND", "Module not found");

					const videos = await tx.query.video.findMany({
						where: { module: input.module },
					});
					const currentIds = new Set(videos.map((video) => video.id));
					const nextIds = new Set(input.videos);
					if (
						input.videos.length !== currentIds.size ||
						nextIds.size !== input.videos.length ||
						[...currentIds].some((id) => !nextIds.has(id))
					) {
						throw getError(
							"INPUT_VALIDATION_FAILED",
							"Video order must include every video exactly once",
						);
					}

					const [updated] = await tx
						.update(schema.module)
						.set({ videos: input.videos })
						.where(eq(schema.module.id, input.module))
						.returning();
					return updated;
				}),
			);
		}),
};
