import type { LeaveRangeOutput } from "@/db/column/leave-range";

type LeaveCheckResult =
	| {
			isLeave: true;
			type: "full" | "multiple" | "partial";
			time: {
				start: Date;
				end: Date;
			};
	  }
	| {
			isLeave: false;
			type: null;
			time: null;
	  };

export const checkAgainstLeaves = (
	checkingDate: Date,
	leaves?: LeaveRangeOutput[] | null,
): LeaveCheckResult => {
	if (!leaves || leaves.length === 0 || Number.isNaN(checkingDate.getTime())) {
		return {
			isLeave: false,
			type: null,
			time: null,
		};
	}

	const checkTime = checkingDate.getTime();

	const matchedLeave = leaves.find((leave) => {
		const startTime = leave.start.getTime();
		const endTime = leave.end.getTime();

		if (Number.isNaN(startTime) || Number.isNaN(endTime)) return false;

		return checkTime >= startTime && checkTime < endTime;
	});

	if (!matchedLeave) {
		return {
			isLeave: false,
			type: null,
			time: null,
		};
	}

	return {
		isLeave: true,
		type: matchedLeave.type,
		time: {
			start: matchedLeave.start,
			end: matchedLeave.end,
		},
	};
};
