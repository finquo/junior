import { z } from "zod";

export const quizZod = z.discriminatedUnion("type", [
	z.object({
		id: z.string(),
		question: z.string(),
		type: z.literal("choices"),
		choices: z.array(z.string()),
		anwser: z.array(z.string()),
	}),
	z.object({
		id: z.string(),
		question: z.string(),
		type: z.literal("options"),
		options: z.array(z.string()),
		anwser: z.string(),
	}),
	z.object({
		id: z.string(),
		question: z.string(),
		type: z.literal("text"),
		anwser: z.string(),
	}),
]);

export type Quiz = z.infer<typeof quizZod>;

export const anwserZod = z.discriminatedUnion("type", [
	z.object({
		id: z.string(),
		questionId: z.string(),
		type: z.literal("choices"),
		anwser: z.array(z.string()),
	}),
	z.object({
		id: z.string(),
		questionId: z.string(),
		type: z.literal("options"),
		anwser: z.string(),
	}),
	z.object({
		id: z.string(),
		questionId: z.string(),
		type: z.literal("text"),
		anwser: z.string(),
	}),
]);

export type Anwser = z.infer<typeof anwserZod>;

export const quizMessageZod = z.object({
	type: z.literal("quiz"),
	slotId: z.string(),
	lessonId: z.string(),
	quizIds: z.array(z.string()).min(1),
});

export type QuizMessage = z.infer<typeof quizMessageZod>;

export const quizSubmitZod = z.array(
	z.object({
		questionId: z.string(),
		anwser: z.union([z.string(), z.array(z.string())]),
	}),
);
