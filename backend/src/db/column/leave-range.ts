import { customType } from "drizzle-orm/pg-core";
import { z } from "zod";

type Leavetype = "full" | "multiple" | "partial";

export const leaveItemZod = z
	.discriminatedUnion("type", [
		z
			.object({
				type: z.literal("full"),
				start: z.coerce.date(),
				end: z.coerce.date().optional(),
			})
			.transform((data) => ({
				...data,
				end: data.end ?? new Date(data.start.getTime() + 24 * 60 * 60 * 1000),
			})),
		z.object({
			type: z.literal("multiple"),
			start: z.coerce.date(),
			end: z.coerce.date(),
		}),
		z.object({
			type: z.literal("partial"),
			start: z.coerce.date(),
			end: z.coerce.date(),
		}),
	])
	.refine((data) => data.start <= data.end, {
		message: "end date must be after start date",
		path: ["end"],
	});

export type LeaveRangeInput = z.infer<typeof leaveItemZod>;

const leaveConvertorZod = leaveItemZod.transform((data) => {
	return `[${data.start.toISOString()},${data.end.toISOString()})`;
});

const output = z
	.string()
	.trim()
	.transform((val, ctx) => {
		const match = val.match(/^[[(](.*?),(.*?)[\])]$/);
		if (!match || !match[1] || !match[2]) {
			ctx.addIssue({
				code: "custom",
				message: `Invalid tstzrange format: "${val}"`,
			});
			return z.NEVER;
		}
		return {
			rawStart: match[1].trim().replace(/^"/, "").replace(/"$/, ""),
			rawEnd: match[2].trim().replace(/^"/, "").replace(/"$/, ""),
		};
	})
	.transform(({ rawStart, rawEnd }, ctx) => {
		const start = new Date(rawStart);
		const end = new Date(rawEnd);

		if (Number.isNaN(start.getTime())) {
			ctx.addIssue({
				code: "custom",
				message: `Invalid start date in tstzrange: "${rawStart}"`,
			});
			return z.NEVER;
		}

		if (Number.isNaN(end.getTime())) {
			ctx.addIssue({
				code: "custom",
				message: `Invalid end date in tstzrange: "${rawEnd}"`,
			});
			return z.NEVER;
		}

		const durationMs = end.getTime() - start.getTime();
		const ONE_DAY_MS = 24 * 60 * 60 * 1000;

		let type: Leavetype = "partial";

		if (durationMs === ONE_DAY_MS) type = "full";
		else if (durationMs > ONE_DAY_MS && durationMs % ONE_DAY_MS === 0)
			type = "multiple";

		return {
			type,
			start,
			end,
		};
	});

export type LeaveRangeOutput = z.infer<typeof output>;

export const leaveRange = customType<{
	data: LeaveRangeOutput;
	driverData: string;
}>({
	dataType() {
		return "tstzrange";
	},
	toDriver(value: LeaveRangeInput) {
		return leaveConvertorZod.parse(value);
	},
	fromDriver(value) {
		return output.parse(value);
	},
	fromJson(value) {
		return output.parse(value);
	},
	forJsonSelect(identifier, sql) {
		return sql`cast(${identifier} as text)`;
	},
});
