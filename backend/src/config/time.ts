export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type TimeRange = { id: string; start: string; end: string };

export type DayAvailability =
	| { enabled: true; ranges: TimeRange[] }
	| { enabled: false };

export type WeekAvailability = Record<DayKey, DayAvailability>;
