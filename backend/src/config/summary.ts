import z from "zod";

export const meetingSummarySchema = z.object({
	title: z.string(),

	voiceBalance: z.object({
		teacherPercentage: z.number().min(0).max(100),
		studentPercentage: z.number().min(0).max(100),
		method: z.string(),
	}),

	participation: z.object({
		teacherQuestionCount: z.number().int().min(0),
		studentMeaningfulAnswerCount: z.number().int().min(0),
	}),

	topicsCovered: z.array(z.string()),

	highlights: z.array(z.string()),

	buzzwords: z.array(
		z.object({
			word: z.string(),
			weight: z.number().int().min(1).max(10),
		}),
	),

	learningOutcomes: z.array(z.string()),

	activitiesDone: z.array(z.string()),

	homework: z.array(z.string()),
});

export type MeetingSummary = z.infer<typeof meetingSummarySchema>;
