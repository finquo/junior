import z from "zod";
import { db } from "@/services";
import { generateZoomToken } from "@/zoom/jwt";
import { publicProcedure, tryAPI } from "../procedure";

const JOIN_WINDOW = 10 * 60 * 1000;

// Dev-only sandbox session. Remove before deploying.
const DEMO_SESSION = "finquo-demo";

export const meetingRouter = {
	demo: publicProcedure.handler(async () => ({
		session: DEMO_SESSION,
		token: await generateZoomToken(DEMO_SESSION, 1),
	})),
	join: publicProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const slot = await tryAPI(
				"db-meeting-join-slot",
				db.query.slot.findFirst({
					where: { id: input.id },
					columns: {
						id: true,
						startTime: true,
						expectedEndTime: true,
						endTime: true,
					},
				}),
			);

			if (!slot) return { status: "not_found" } as const;

			const startTime = slot.startTime;
			const endTime = slot.endTime ?? slot.expectedEndTime;
			const now = Date.now();

			if (now < startTime.getTime() - JOIN_WINDOW)
				return { status: "upcoming", startTime, endTime } as const;

			if (now > endTime.getTime())
				return { status: "ended", startTime, endTime } as const;

			return {
				status: "live",
				startTime,
				endTime,
				token: await generateZoomToken(slot.id),
			} as const;
		}),
};
