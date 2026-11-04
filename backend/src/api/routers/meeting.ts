import z from "zod";
import { db } from "@/services";
import { generateZoomToken } from "@/zoom/jwt";
import { publicProcedure, tryAPI } from "../procedure";

const JOIN_WINDOW = 10 * 60 * 1000;
const DEMO_ID = "demo";

export const meetingRouter = {
	join: publicProcedure
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
							title: DEMO_ID,
							user: crypto.randomUUID(),
						},
						0,
					),
				} as const;
			}

			const slot = await tryAPI(
				"db-meeting-join-slot",
				db.query.slot.findFirst({
					where: { id: input.id },
					columns: {
						id: true,
						lessonId: true,
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
						title: slot.lessonId,
						user: crypto.randomUUID(),
					},
					0,
				),
			} as const;
		}),
};
