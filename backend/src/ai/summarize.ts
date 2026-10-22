import { generateObject } from "ai";
import { sarvam } from "sarvam-ai-sdk";
import { z } from "zod";

export const meetingSummarySchema = z.object({
	title: z.string(),
	overallSummary: z.string(),

	engagement: z.object({
		teacherEngagement: z.string(),
		studentEngagement: z.string(),
		engagementScore: z.object({
			teacher: z.number().min(0).max(100),
			student: z.number().min(0).max(100),
		}),
	}),

	topicsCovered: z.array(
		z.object({
			topic: z.string(),
			explanation: z.string(),
			studentUnderstanding: z.enum([
				"clear",
				"partial",
				"unclear",
				"not_assessed",
			]),
		}),
	),

	studentQuestionsAndDoubts: z.array(
		z.object({
			question: z.string(),
			wasResolved: z.boolean(),
			teacherResponse: z.string().nullable(),
		}),
	),

	interactionBreakdown: z.object({
		teacherSpeakingPercentage: z.number().min(0).max(100),
		studentSpeakingPercentage: z.number().min(0).max(100),
		unknownOrSilencePercentage: z.number().min(0).max(100),
		method: z.string(),
	}),

	keyTakeaways: z.array(z.string()),
	suggestedNextSteps: z.array(z.string()),
});

export async function summarizeTranscript(transcript: string) {
	const { object } = await generateObject({
		model: sarvam("sarvam-105b", {
			reasoning_effort: "none",
			experimental_json_mode: true,
		}),
		temperature: 0.2,
		maxOutputTokens: 3000,
		schema: meetingSummarySchema,
		prompt: `You are an expert educational meeting analyst.

Analyze this transcript from a 1-to-1 video meeting between a teacher and a student.
The transcript may contain speaker labels, timestamps, transcription errors, and mixed languages.

Produce a factual, structured summary.

Rules:
- Do not invent topics, questions, or events absent from the transcript.
- If speaker labels are missing or unreliable, infer them cautiously from context.
- Use timestamps to calculate speaking-time percentages when available.
- If timestamps are unavailable, estimate from dialogue volume and distribution, and explain that in "method".
- The three interaction percentages should total approximately 100.
- If the student asked no questions or doubts, return an empty array.
- Make takeaways and next steps specific and actionable.

TRANSCRIPT:
${transcript}`,
	});

	return object;
}

// type TranscriptionChunk = {
// 	speaker?: "teacher" | "student" | "unknown";
// 	text: string;
// 	startSeconds?: number;
// 	endSeconds?: number;
// };

// const transcriptions: TranscriptionChunk[] = [
// 	{
// 		speaker: "teacher",
// 		text: "Today we will revise recursion and solve a few interview problems.",
// 		startSeconds: 0,
// 		endSeconds: 12,
// 	},
// 	{
// 		speaker: "student",
// 		text: "Sir, I understand base cases, but I get confused about the recursive call.",
// 		startSeconds: 13,
// 		endSeconds: 21,
// 	},
// 	{
// 		speaker: "teacher",
// 		text: "Think of recursion as solving a smaller version of the same problem. Let us trace factorial.",
// 		startSeconds: 22,
// 		endSeconds: 40,
// 	},
// 	{
// 		speaker: "student",
// 		text: "So factorial(3) calls factorial(2), then factorial(1)?",
// 		startSeconds: 41,
// 		endSeconds: 48,
// 	},
// 	{
// 		speaker: "teacher",
// 		text: "Exactly. Now try writing it yourself.",
// 		startSeconds: 49,
// 		endSeconds: 55,
// 	},
// ];

// if (process.argv[1]?.endsWith("summarize.ts")) {
// 	const transcript = transcriptions
// 		.map((chunk, index) => {
// 			const speaker = chunk.speaker ?? "unknown";
// 			const time =
// 				chunk.startSeconds !== undefined && chunk.endSeconds !== undefined
// 					? ` [${chunk.startSeconds}s-${chunk.endSeconds}s]`
// 					: "";

// 			return `${index + 1}. ${speaker.toUpperCase()}${time}: ${chunk.text.trim()}`;
// 		})
// 		.join("\n");

// 	console.dir(await summarizeTranscript(transcript), { depth: null });
// }
