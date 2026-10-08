import { format } from "ms";

export const getRelateTime = (giveDate: Date) => {
	return format(Date.now() - giveDate.getTime(), {
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
