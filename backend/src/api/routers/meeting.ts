import { and, eq } from "drizzle-orm";
import z from "zod";
import {
	getAPI,
	getError,
	getRolesProcedure,
	publicProcedure,
	tryAPI,
} from "@/api/procedure";
import { schema } from "@/db";
import { db } from "@/services";
import { MapRole } from "@/utils/role";
import { getZoomAPI } from "@/zoom/api";
import { generateZoomToken } from "@/zoom/jwt";

const endRecordingBeforeStopping = true;

const JOIN_WINDOW = 10 * 60 * 1000;

const DEMO_ID = "demo";

export const meetingRouter = {
	joinAsGuest: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			// Guest demo sandbox. Remove this branch before deploying.
			if (input.id === DEMO_ID) {
				const now = Date.now();
				return {
					status: "live",
					meetingLink: null,
					session: DEMO_ID,
					startTime: new Date(now),
					endTime: new Date(now + 2 * 60 * 60 * 1000),
					token: await generateZoomToken(
						{
							id: DEMO_ID,
							user: crypto.randomUUID(),
						},
						"guest",
					),
				} as const;
			}

			const slot = await tryAPI(
				"db-meeting-join-slot",
				db.query.slot.findFirst({
					where: { id: input.id },
					columns: {
						id: true,
						meetingLink: true,
						startTime: true,
						expectedEndTime: true,
						endTime: true,
					},
				}),
			);

			if (!slot) return { status: "not_found", meetingLink: null } as const;

			const startTime = slot.startTime;
			const endTime = slot.endTime ?? slot.expectedEndTime;
			const now = Date.now();

			if (now < startTime.getTime() - JOIN_WINDOW)
				return {
					status: "upcoming",
					meetingLink: slot.meetingLink,
					startTime,
					endTime,
				} as const;

			if (now > endTime.getTime())
				return {
					status: "ended",
					meetingLink: slot.meetingLink,
					startTime,
					endTime,
				} as const;

			return {
				status: "live",
				meetingLink: slot.meetingLink,
				session: slot.id,
				startTime,
				endTime,
				token: await generateZoomToken(
					{
						id: slot.id,
						user: crypto.randomUUID(),
					},
					"guest",
				),
			} as const;
		}),
	join: getRolesProcedure([
		"admin",
		"scheduler",
		"teacher",
		"student",
		"qa_auditor",
	])
		.input(
			z.object({
				id: z.string(),
			}),
		)
		.handler(async ({ input, context }) => {
			const role = MapRole(context.role, {
				admin: "host",
				scheduler: "host",
				teacher: "host",
				student: "guest",
				qa_auditor: "guest",
			} as const);

			// Authenticated demo sandbox. Remove this branch before deploying.
			if (input.id === DEMO_ID) {
				const now = Date.now();
				return {
					status: "live",
					meetingLink: null,
					session: DEMO_ID,
					startTime: new Date(now),
					endTime: new Date(now + 2 * 60 * 60 * 1000),
					token: await generateZoomToken(
						{
							id: DEMO_ID,
							user: context.user.id,
						},
						role,
					),
				} as const;
			}

			const slot = await tryAPI(
				"db-core-join-slot",
				db.query.slot.findFirst({
					where: { id: input.id },
					columns: {
						id: true,
						meetingLink: true,
						startTime: true,
						expectedEndTime: true,
						endTime: true,
						lessonId: true,
						studentId: true,
						teacherId: true,
						schedulerId: true,
					},
				}),
			);

			if (!slot) return { status: "not_found", meetingLink: null } as const;

			const authorized = MapRole(context.role, {
				admin: true,
				scheduler: slot.schedulerId === context.user.id,
				teacher: slot.teacherId === context.user.id,
				student: slot.studentId === context.user.id,
				qa_auditor: true,
			});

			if (!authorized)
				throw getError(
					"FORBIDDEN",
					"You are not authorized to join this meeting",
				);

			const startTime = slot.startTime;
			const endTime = slot.endTime ?? slot.expectedEndTime;
			const now = Date.now();

			if (now < startTime.getTime() - JOIN_WINDOW)
				return {
					status: "upcoming",
					meetingLink: slot.meetingLink,
					startTime,
					endTime,
				} as const;

			if (now > endTime.getTime())
				return {
					status: "ended",
					meetingLink: slot.meetingLink,
					startTime,
					endTime,
				} as const;

			return {
				status: "live",
				meetingLink: slot.meetingLink,
				session: slot.id,
				startTime,
				endTime,
				token: await generateZoomToken(
					{
						id: slot.id,
						user: context.user.id,
					},
					role,
				),
			} as const;
		}),
	end: getRolesProcedure(["admin", "scheduler"])
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			let startTime = new Date();

			if (input.id !== DEMO_ID) {
				const slot = await tryAPI(
					"db-core-end-slot-find",
					db.query.slot.findFirst({
						where: MapRole(context.role, {
							admin: { id: input.id },
							scheduler: { id: input.id, schedulerId: context.user.id },
						}),
						columns: { id: true, startTime: true, expectedEndTime: true },
					}),
				);
				if (!slot) throw getError("NOT_FOUND", "Slot not found");
				startTime = slot.startTime;
			}

			const zoomAPI = await getZoomAPI();

			const { data: list, error: listError } = await zoomAPI("/sessions", {
				query: {
					type: "past",
					session_name: input.id,
					from: startTime,
				},
			});

			if (listError)
				throw getError(
					"INTERNAL_SERVER_ERROR",
					`Zoom list sessions failed (${listError.status})`,
					listError,
				);

			const sessions = list.sessions ?? [];

			if (!sessions.length)
				throw getError("NOT_FOUND", "No Zoom session found for this slot");

			if (input.id !== DEMO_ID) {
				await tryAPI(
					"db-meeting-end-mark-attended",
					db
						.update(schema.slot)
						.set({ status: "attended", endTime: new Date() })
						.where(
							MapRole(context.role, {
								admin: eq(schema.slot.id, input.id),
								scheduler: and(
									eq(schema.slot.id, input.id),
									eq(schema.slot.schedulerId, context.user.id),
								),
							}),
						),
				);
			}

			for (const session of sessions) {
				const { error } = await zoomAPI(
					"/sessions/:sessionId/livestream/status",
					{
						params: { sessionId: session.id },
						body: {
							action: "stop",
						},
					},
				);

				if (error) console.error(error);

				const { error: error2 } = await zoomAPI("/sessions/:sessionId/status", {
					params: { sessionId: session.id },
					body: {
						action: "end",
					},
				});

				if (error2) console.error(error2);
			}

			return { ended: true } as const;
		}),
	log: getRolesProcedure(["admin", "scheduler", "qa_auditor"])
		.input(z.object({ id: z.string() }))
		.handler(async ({ input, context }) => {
			const slot = await tryAPI(
				"db-core-log-slot-find",
				db.query.slot.findFirst({
					where: MapRole(context.role, {
						admin: { id: input.id },
						qa_auditor: { id: input.id },
						scheduler: { id: input.id, schedulerId: context.user.id },
					}),
					columns: { id: true },
				}),
			);
			if (!slot) throw getError("NOT_FOUND", "Slot not found");

			return await getAPI(
				"db-core-slot-logs",
				db.query.slotLog.findMany({
					where: { slotId: slot.id },
					orderBy: { createdAt: "desc" },
				}),
				[],
			);
		}),
};
