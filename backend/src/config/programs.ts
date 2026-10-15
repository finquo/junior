import z from "zod";
import type { CountryCodes } from "./code";

export type Program = {
	id: string;
	name: string;
	description: string;
	count: number;
	price: Record<CountryCodes, number>;
};

export const programs = [
	{
		id: "financial-literacy",
		name: "Financial Literacy",
		description: "Financial Literacy",
		count: 30,
		price: {
			IN: 1000,
			US: 10,
		},
	} as const,
] satisfies Program[];

export const programKeys = programs.map((p) => p.id);

export const ProgramZod = z.enum(programKeys);

export type ProgramKeys = (typeof programKeys)[number];
