import { useMemo } from "react";

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

function timeStringToMinutes(time: string): number {
	const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
	if (!match) return 0;
	const h = Number.parseInt(match[1] as string, 10);
	const m = Number.parseInt(match[2] as string, 10);
	return Math.min(1440, Math.max(0, h * 60 + m));
}

function generateSlots(
	startMin: number,
	endMin: number,
	hourly = false,
): string[] {
	const slots: string[] = [];
	const step = hourly ? 60 : 15;

	// Align to the next valid step interval
	const remainder = startMin % step;
	const firstSlot = remainder === 0 ? startMin : startMin + (step - remainder);

	for (let m = firstSlot; m <= endMin; m += step) {
		const h = Math.floor(m / 60);
		const min = m % 60;
		const hourStr = h.toString().padStart(2, "0");
		const minStr = min.toString().padStart(2, "0");
		slots.push(`${hourStr}:${minStr}`);
	}
	return slots;
}

export function useTimePeriodGroups(
	lowerLimit?: string,
	upperLimit?: string,
	isHourly = false,
): TimePeriodGroup[] {
	return useMemo(() => {
		const minMinute = lowerLimit ? timeStringToMinutes(lowerLimit) : 0;
		const maxMinute = upperLimit
			? timeStringToMinutes(upperLimit)
			: 23 * 60 + (isHourly ? 0 : 45);

		return TIME_PERIODS.map((p) => {
			const pStartMin = p.startHour * 60;
			const pEndMin = p.endHour * 60 + (isHourly ? 0 : 45);

			const start = Math.max(pStartMin, minMinute);
			const end = Math.min(pEndMin, maxMinute);

			return {
				key: p.key,
				label: p.label,
				times: start <= end ? generateSlots(start, end, isHourly) : [],
			};
		}).filter((p) => p.times.length > 0);
	}, [lowerLimit, upperLimit, isHourly]);
}
