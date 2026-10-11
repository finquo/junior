import z from "zod";

export const period = [30, 60, 120, 180];

// converted to miliseconds
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

const timeSchema = z.string().refine((value) => {
	const [hours, minutes] = value.split(":");
	if (!hours || !minutes) return false;

	const validStrings = /^\d{2}$/.test(hours) && /^\d{2}$/.test(minutes);

	if (!validStrings) return false;

	const h = Number(hours);
	const m = Number(minutes);

	return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}, "Invalid time, expected HH:MM");

const enabledZod = z.object({
	enabled: z.boolean(),
	ranges: z.object({ start: timeSchema, end: timeSchema }).array().default([]),
});

export const availabilityZod = z.record(dayKeysZod, enabledZod);

export type Availability = z.infer<typeof availabilityZod>;

export const intervalHourZod = z
	.number()
	.int()
	.nonnegative()
	.default(0)
	.transform((min) => ({
		hours: Math.floor(min / 60),
		minutes: min % 60,
	}))
	.transform(({ hours, minutes }) => `${hours} hours ${minutes} minutes`);

export * from "../db/column/leave-range";
