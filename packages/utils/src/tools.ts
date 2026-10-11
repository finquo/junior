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
	const [hours = 0, minutes = 0, seconds = 0, milisecond = 0] = time
		.split(":")
		.map(Number);
	const result = new Date(date);
	result.setHours(hours, minutes, seconds, milisecond);
	return result;
};
