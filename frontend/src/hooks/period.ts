import { useMemo } from "react";

export const DURATIONS = ["30 mins", "1 hour", "2 hours"] as const;

type TimePeriodKey = ["night", "morning", "noon", "evening"][number];

type TimePeriodGroup = {
	key: TimePeriodKey;
	label: string;
	times: string[];
};

const TIME_PERIODS = [
	{ key: "night", label: "🌙", startHour: 0, endHour: 6 },
	{ key: "morning", label: "🌄", startHour: 7, endHour: 11 },
	{ key: "noon", label: "☀️", startHour: 12, endHour: 16 },
	{ key: "evening", label: "🌃", startHour: 17, endHour: 23 },
] as const;

function generateSlots(
	startHour: number,
	endHour: number,
	hourly = false,
): string[] {
	const slots: string[] = [];
	for (let h = startHour; h <= endHour; h++) {
		const hourStr = h.toString().padStart(2, "0");
		if (hourly) {
			slots.push(`${hourStr}:00`);
		} else {
			slots.push(
				`${hourStr}:00`,
				`${hourStr}:15`,
				`${hourStr}:30`,
				`${hourStr}:45`,
			);
		}
	}
	return slots;
}

export function useTimePeriodGroups(
	period?: string,
	isHourly?: boolean,
): TimePeriodGroup[] {
	return useMemo(() => {
		let minHour = 0;
		let maxHour = 23;

		if (period) {
			const [start, end] = period.split("-").map(Number);

			if (!start || !end) throw Error("wrong period string");

			minHour = start;
			maxHour = end < start ? end + 12 : end;
			// handles 12-hour format e.g. "9-5" -> 9 to 17
		}

		return TIME_PERIODS.map((p) => {
			const start = Math.max(p.startHour, minHour);
			const end = Math.min(p.endHour, maxHour);

			return {
				key: p.key,
				label: p.label,
				times: start <= end ? generateSlots(start, end, isHourly) : [],
			};
		}).filter((p) => p.times.length > 0);
	}, [period, isHourly]);
}
