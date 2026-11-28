import { InsertVideoSchema } from "backend/db";
import { z } from "zod";

const videoFormSchema = InsertVideoSchema.pick({
	name: true,
	description: true,
});

export const videoCreateFormSchema = videoFormSchema.partial().extend({
	course: z.string().min(1, "Course is required").optional(),
	module: z.string().min(1, "Module is required").optional(),
	name: z.string().trim().min(1, "Video name is required").optional(),
});

export const videoUpdateFormSchema = videoFormSchema;
