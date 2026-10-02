import { sql } from "drizzle-orm";
import { customType, parsePgArray } from "drizzle-orm/pg-core";

export type DateRange = {
	start: Date;
	end: Date;
};

export type DateRangeInput =
	| DateRange
	| { start: Date | string | number; end: Date | string | number }
	| [Date | string | number, Date | string | number]
	| string;

export function parseTstzrange(value: unknown): DateRange {
	if (
		typeof value === "object" &&
		value !== null &&
		"start" in value &&
		"end" in value
	) {
		const obj = value as { start: unknown; end: unknown };
		return {
			start:
				obj.start instanceof Date
					? obj.start
					: new Date(obj.start as string | number),
			end:
				obj.end instanceof Date
					? obj.end
					: new Date(obj.end as string | number),
		};
	}

	if (typeof value !== "string") {
		throw new Error(
			`Invalid tstzrange value: expected string, got ${typeof value}`,
		);
	}

	const trimmed = value.trim();
	if (trimmed === "empty" || trimmed === "") {
		throw new Error("Cannot parse empty tstzrange into DateRange");
	}

	const match = trimmed.match(/^[[(](.*?),(.*?)[\\])]$/);
	if (!match) {
		throw new Error(
			`Invalid tstzrange format: "${value}". Expected "[start, end]" or "(start, end)"`,
		);
	}

	const rawStart = match[1].trim().replace(/^"/, "").replace(/"$/, "");
	const rawEnd = match[2].trim().replace(/^"/, "").replace(/"$/, "");

	const start = new Date(rawStart);
	const end = new Date(rawEnd);

	if (isNaN(start.getTime())) {
		throw new Error(
			`Invalid start date in tstzrange "${value}": "${rawStart}"`,
		);
	}
	if (isNaN(end.getTime())) {
		throw new Error(`Invalid end date in tstzrange "${value}": "${rawEnd}"`);
	}

	return { start, end };
}

export function formatTstzrange(value: unknown): string {
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (/^[[(].*?,.*?[\\])]$/.test(trimmed)) {
			parseTstzrange(trimmed); // validates dates inside
			return trimmed;
		}
		throw new Error(`Invalid tstzrange string format: "${value}"`);
	}

	let start: Date;
	let end: Date;

	if (Array.isArray(value)) {
		if (value.length !== 2) {
			throw new Error(
				"tstzrange array must have exactly 2 elements: [start, end]",
			);
		}
		start = value[0] instanceof Date ? value[0] : new Date(value[0]);
		end = value[1] instanceof Date ? value[1] : new Date(value[1]);
	} else if (
		typeof value === "object" &&
		value !== null &&
		"start" in value &&
		"end" in value
	) {
		const obj = value as { start: unknown; end: unknown };
		start =
			obj.start instanceof Date
				? obj.start
				: new Date(obj.start as string | number);
		end =
			obj.end instanceof Date ? obj.end : new Date(obj.end as string | number);
	} else {
		throw new Error(
			`Invalid tstzrange input: expected { start, end } or [start, end], got ${JSON.stringify(value)}`,
		);
	}

	if (isNaN(start.getTime())) {
		throw new Error("Invalid start date in tstzrange");
	}
	if (isNaN(end.getTime())) {
		throw new Error("Invalid end date in tstzrange");
	}
	if (start > end) {
		throw new Error(
			`Invalid tstzrange: start date (${start.toISOString()}) must be before or equal to end date (${end.toISOString()})`,
		);
	}

	return `[${start.toISOString()},${end.toISOString()}]`;
}

function parseDriverValue(value: unknown): any {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value)) {
		return value.map(parseDriverValue);
	}
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
			const elements = parsePgArray(trimmed);
			return elements.map(parseDriverValue);
		}
		return parseTstzrange(trimmed);
	}
	if (typeof value === "object" && "start" in value && "end" in value) {
		return value;
	}
	return value;
}

function toDriverValue(value: unknown): any {
	if (value === null || value === undefined) return value;
	if (Array.isArray(value)) {
		// Distinguish [Date, Date] (single range tuple) vs array of ranges
		if (
			value.length === 2 &&
			(value[0] instanceof Date ||
				typeof value[0] === "number" ||
				(typeof value[0] === "string" && !value[0].startsWith("["))) &&
			(value[1] instanceof Date ||
				typeof value[1] === "number" ||
				(typeof value[1] === "string" && !value[1].startsWith("[")))
		) {
			return formatTstzrange(value);
		}
		return value.map(toDriverValue);
	}
	return formatTstzrange(value);
}

export const tstzrange = customType<{
	data: DateRange;
	driverData: string;
}>({
	dataType() {
		return "tstzrange";
	},
	toDriver(value): string {
		return toDriverValue(value);
	},
	fromDriver(value): DateRange {
		return parseDriverValue(value);
	},
	fromJson(value: unknown) {
		return parseDriverValue(value);
	},
	forJsonSelect(identifier, sql) {
		return sql`cast(${identifier} as text)`;
	},
});
