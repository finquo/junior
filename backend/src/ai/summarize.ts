import { generateObject, type LanguageModel } from "ai";
import { type MeetingSummary, meetingSummarySchema } from "@/config/summary";
import { openrouter } from "./index";

export async function summarizeTranscript(
	transcript: string,
	previousSummary?: MeetingSummary | null,
) {
	const previous = previousSummary
		? `PREVIOUS SESSION SUMMARY (for continuity only, do not copy its wording or invent carry-overs from it):\n${JSON.stringify(previousSummary)}\n\n`
		: "";

	const { object } = await generateObject({
		model: openrouter("google/gemini-2.5-flash") as LanguageModel,
		temperature: 0.2,
		maxOutputTokens: 3000,
		schema: meetingSummarySchema,
		prompt: `You are an expert educational meeting analyst.

Analyze this transcript from a 1-to-1 video meeting between a teacher and a student.
The transcript may contain speaker labels, timestamps, transcription errors, and mixed languages.

Produce a factual, structured summary.

Rules:
- Do not invent topics, questions, activities, or events absent from the transcript.
- If speaker labels are missing or unreliable, infer them cautiously from context.
- voiceBalance: teacherPercentage and studentPercentage must total 100. Use timestamps when available; otherwise estimate from dialogue volume and explain that in "method".
- participation.teacherQuestionCount: count questions asked by the teacher.
- participation.studentMeaningfulAnswerCount: count student answers that contain substance. Do not count yes/no/ok/hmm replies.
- topicsCovered: topic names only, in the order they were discussed. Keep each short.
- highlights: specific sentences describing the notable moments of the session.
- buzzwords: key terms from the session with a weight from 1 (minor) to 10 (central).
- learningOutcomes: concrete points the student learned in this session.
- activitiesDone: activities actually carried out during the session.
- homework: actionable tasks the student should do at home or in daily life before the next session. Only include tasks that were set or clearly implied in the transcript.
- Empty arrays are acceptable when the transcript supports nothing for a field.

${previous}TRANSCRIPT:
${transcript}`,
	});

	return object;
}
