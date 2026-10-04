import { z } from "zod";

export const quizZod = z.discriminatedUnion("type", [
	z.object({
		question: z.string(),
		type: z.literal("choices"),
		choices: z.array(z.string()),
		anwser: z.array(z.string()),
	}),
	z.object({
		question: z.string(),
		type: z.literal("options"),
		options: z.array(z.string()),
		anwser: z.string(),
	}),
	z.object({
		question: z.string(),
		type: z.literal("text"),
		anwser: z.string(),
	}),
]);

export type Quiz = z.infer<typeof quizZod>;

export const anwserZod = z.discriminatedUnion("type", [
	z.object({
		type: z.literal("choices"),
		anwser: z.array(z.string()),
	}),
	z.object({
		type: z.literal("options"),
		anwser: z.string(),
	}),
	z.object({
		type: z.literal("text"),
		anwser: z.string(),
	}),
]);

export type Anwser = z.infer<typeof anwserZod>;
