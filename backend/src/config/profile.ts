import { z } from "zod";

export const noteZod = z.object({
	text: z.string(),
	writterBy: z.string(),
	createdAt: z.string(), // ISO 8601
});

export type Note = z.infer<typeof noteZod>;

export const addressZod = z.object({
	line1: z.string(),
	line2: z.string().optional(),
	city: z.string(),
	state: z.string(),
	postalCode: z.string(),
	country: z.string(),
});

export type Address = z.infer<typeof addressZod>;

export const schoolingZod = z.enum([
	"icse",
	"cbse",
	"state",
	"homeschool",
	"online",
	"other",
	"unknown",
]);

export type Schooling = z.infer<typeof schoolingZod>;

export const experienceZod = z.object({
	title: z.string(), // e.g. "Senior Math Teacher"
	organization: z.string(), // e.g. "Greenwood High School"
	description: z.string().optional(), // optional details
	startedAt: z.string(), // ISO date
	endedAt: z.string().optional(), // ISO date or undefined if current
	writtenBy: z.string(), // who recorded/updated this entry
	createdAt: z.string(), // ISO timestamp of this version
});

export type Experience = z.infer<typeof experienceZod>;
