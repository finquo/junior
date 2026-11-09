import { z } from "zod";

export const ProgramMaterialZod = z.object({
	id: z.string(),
	name: z.string().trim().min(1, "Name is required"),
	lessons: z.array(z.string()),
});

export type ProgramMaterial = z.infer<typeof ProgramMaterialZod>;
