import { minutesToTimeString, timeStringToMinutes } from "utils";
import type { Availability } from "@/config/time";
import type { LeaveRangeOutput } from "@/db/column/leave-range";

const MINUTES_IN_DAY = 24 * 60;

type DayAvailability = Availability[keyof Availability];

type MinutesInterval = {
	start: number;
	end: number;
};

export type SlotCheckStatus =
	| "available-undefined"
	| "available"
	| "leave"
	| "partial-leave"
	| "unavailable";

export type SlotUnavailableItem = {
	id: string;
	start: string;
	end: string;
	label: string;
	type: "unavailable" | "leave" | "conflict";
};

export const getDayBounds = (date: Date) => {
	const dayStart = new Date(date);
	dayStart.setHours(0, 0, 0, 0);

	const dayEnd = new Date(dayStart);
	dayEnd.setDate(dayEnd.getDate() + 1);

	return { dayStart, dayEnd };
};

const minutesFromDayStart = (date: Date, dayStart: Date) =>
	Math.round((date.getTime() - dayStart.getTime()) / 60_000);

const getAvailabilityGaps = (
	availability?: DayAvailability | null,
): MinutesInterval[] => {
	const ranges =
		availability?.enabled && availability.ranges?.length
			? availability.ranges
					.map((range) => ({
						start: timeStringToMinutes(range.start),
						end: timeStringToMinutes(range.end),
					}))
					.sort((a, b) => a.start - b.start)
			: [];

	// No usable availability means the whole day is blocked.
	if (ranges.length === 0) return [{ start: 0, end: MINUTES_IN_DAY }];

	const gaps: MinutesInterval[] = [];
	let cursor = 0;

	for (const range of ranges) {
		if (range.start > cursor) gaps.push({ start: cursor, end: range.start });
		cursor = Math.max(cursor, range.end);
	}

	if (cursor < MINUTES_IN_DAY)
		gaps.push({ start: cursor, end: MINUTES_IN_DAY });

	return gaps;
};

export const getLeavesForDay = (
	leaves: LeaveRangeOutput[],
	dayStart: Date,
	dayEnd: Date,
) => leaves.filter((leave) => leave.end > dayStart && leave.start < dayEnd);

export const getSlotCheckStatus = ({
	availability,
	leaves = [],
}: {
	availability?: DayAvailability | null;
	leaves?: LeaveRangeOutput[];
}): SlotCheckStatus => {
	const hasAvailability = Boolean(
		availability?.enabled && availability.ranges?.length,
	);

	if (!hasAvailability) return "unavailable";
	if (leaves.some((leave) => leave.type !== "partial")) return "leave";
	if (leaves.length > 0) return "partial-leave";

	return "available";
};

export const getUnavailableIntervals = ({
	availability,
	leaves = [],
	bookedSlots = [],
	dayStart,
}: {
	availability?: DayAvailability | null;
	leaves?: LeaveRangeOutput[];
	bookedSlots?: { id: string; startTime: Date; expectedEndTime: Date }[];
	dayStart: Date;
}): SlotUnavailableItem[] => {
	const intervals: (MinutesInterval & {
		id: string;
		label: string;
		type: SlotUnavailableItem["type"];
	})[] = [];

	getAvailabilityGaps(availability).forEach((gap, index) => {
		intervals.push({
			id: `availability-${index}`,
			...gap,
			label: "Outside teacher availability",
			type: "unavailable",
		});
	});

	leaves.forEach((leave, index) => {
		intervals.push({
			id: `leave-${index}`,
			start: minutesFromDayStart(leave.start, dayStart),
			end: minutesFromDayStart(leave.end, dayStart),
			label:
				leave.type === "partial"
					? "Teacher on partial leave"
					: "Teacher on leave",
			type: "leave",
		});
	});

	bookedSlots.forEach((slot) => {
		intervals.push({
			id: slot.id,
			start: minutesFromDayStart(slot.startTime, dayStart),
			end: minutesFromDayStart(slot.expectedEndTime, dayStart),
			label: "Booked slot",
			type: "conflict",
		});
	});

	return intervals
		.filter((interval) => interval.end > interval.start)
		.map((interval) => ({
			id: interval.id,
			start: minutesToTimeString(interval.start),
			end: minutesToTimeString(interval.end),
			label: interval.label,
			type: interval.type,
		}));
};
