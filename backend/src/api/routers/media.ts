import z from "zod";
import { createSplitAudioJob, createToAudioJob } from "@/aws/media";
import { getRolesProcedure, tryAPI } from "../procedure";

const jobInput = z.object({ id: z.string().min(1) });

export const mediaRouter = {
	jobs: {
		toAudio: getRolesProcedure(["admin", "scheduler"])
			.input(jobInput)
			.handler(({ input }) =>
				tryAPI("aws-mediaconvert-video-to-audio", createToAudioJob(input)),
			),

		splitAudio: getRolesProcedure(["admin", "scheduler"])
			.input(jobInput)
			.handler(({ input }) =>
				tryAPI("aws-mediaconvert-split-audio", createSplitAudioJob(input)),
			),
	},
};
