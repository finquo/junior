import z from "zod";

export const periods = {
	"30 min": 30,
	"1 hr": 60,
	"2 hrs": 120,
} as const;

export const dayKeys = [
	"mon",
	"tue",
	"wed",
	"thu",
	"fri",
	"sat",
	"sun",
] as const;

export const periodKeyZod = z
	.enum(Object.keys(periods))
	.transform((p) => getPeriodMinutes(p) * 60 * 1000);

const dayKeysZod = z.enum(dayKeys);

export const getPeriodMinutes = (key: keyof typeof periods) => periods[key];

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

export const dateLeave = z
	.object({
		start: z.coerce.date(),
		end: z.coerce.date(),
	})
	.refine((data) => data.start <= data.end, {
		message: "start date must be before or equal to end date",
		path: ["end"],
	})
	.refine(
		(data) => {
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			return data.start >= today;
		},
		{
			message: "leave date cannot be in the past",
			path: ["start"],
		},
	)
	.transform(
		({ start, end }) => `[${start.toISOString()},${end.toISOString()}]`,
	);

export const timeLeave = z
	.object({
		start: z.coerce.date(),
		end: z.coerce.date(),
	})
	.refine((data) => data.start <= data.end, {
		message: "start time must be before or equal to end time",
		path: ["end"],
	})
	.refine(
		(data) => {
			return data.start >= new Date(Date.now() - 60_000);
		},
		{
			message: "leave time cannot be in the past",
			path: ["start"],
		},
	)
	.transform(({ start, end }) => {
		const diffMs = Math.max(0, end.getTime() - start.getTime());
		const totalMinutes = Math.floor(diffMs / 60000);
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		return `${hours} hours ${minutes} minutes`;
	});
