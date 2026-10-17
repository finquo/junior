import { format } from "ms";

export const getRelateTime = (giveDate: Date) => {
	return format(Date.now() - giveDate.getTime(), {
		long: true,
	});
};

export const getRangeTime = (startDate: Date, endDate: Date) => {
	return format(endDate.getTime() - startDate.getTime(), {
		long: true,
	});
};

export const formatTimeString = (time: string) => {
	const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);
	const ms = (hours * 3600 + minutes * 60 + seconds) * 1000;
	return format(ms, {
		long: true,
	});
};

export const mergeDateWithTimeString = (date: Date, time: string) => {
	const [hours = 0, minutes = 0, seconds = 0, milliseconds = 0] = time
		.split(":")
		.map(Number);
	const result = new Date(date);
	result.setHours(hours, minutes, seconds, milliseconds);
	return result;
};

export const getDurationFromInterval = (time: string) => {
	const [hours = 0, minutes = 0, seconds = 0, milliseconds = 0] = time
		.split(":")
		.map(Number);

	return hours * 60 + minutes + seconds / 60 + milliseconds / 60_000;
};

export const timeStringToMinutes = (time: string) => {
	const [hours = 0, minutes = 0] = time.split(":").map(Number);
	return hours * 60 + minutes;
};

export const minutesToTimeString = (minutes: number) => {
	const clamped = Math.max(0, Math.min(24 * 60, minutes));
	return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(
		clamped % 60,
	).padStart(2, "0")}`;
};
