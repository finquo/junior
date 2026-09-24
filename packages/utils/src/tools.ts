import { format } from "ms";

export const getRelateTime = (giveDate: Date) => {
	return format(Date.now() - giveDate.getTime(), {
		long: true,
	});
};
