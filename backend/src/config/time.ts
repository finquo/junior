import z from "zod";

export const periodZod = z
	.number()
	.min(15)
	.max(250)
	.transform((p) => p * 60 * 1000);

export const dayKeys = [
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
	"sun",
] as const;

const dayKeysZod = z.enum(dayKeys);

export const getDaykey = (i: number) => {
	if (i > 6 || i < 0) throw Error("Wrong day number");

	const key = dayKeys[i];
	if (!key) throw Error("Wrong day number, Day key not found");

	return key;
};

const timeRangeZod = z.object({ start: z.string(), end: z.string() });

export const availabilityZod = z.record(
	dayKeysZod,
	z.object({ enabled: z.boolean(), ranges: timeRangeZod.array().default([]) }),
);

export type Availability = z.infer<typeof availabilityZod>;
