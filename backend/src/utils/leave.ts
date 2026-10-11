import type { LeaveRangeOutput } from "@/db/column/leave-range";

type LeaveCheckResult =
	| {
			isLeave: true;
			reason: string;
			type: "full" | "multiple" | "partial";
			time: {
				start: Date;
				end: Date;
			};
	  }
	| {
			isLeave: false;
			reason: string;
			type: null;
			time: null;
	  };

export const checkAgainstLeaves = (
	checkingDate: Date,
	leaves: LeaveRangeOutput[] = [],
	checkingTime = 0,
): LeaveCheckResult => {
	const checkStartTime = checkingDate.getTime();
	const checkEndTime = checkStartTime + checkingTime;

	if (leaves.length === 0) {
		return {
			isLeave: false,
			reason: "no-leaves",
			type: null,
			time: null,
		};
	}

	const matchedLeave = leaves.find((leave) => {
		const startTime = leave.start.getTime();
		const endTime = leave.end.getTime();

		if (checkStartTime >= startTime && checkStartTime < endTime) return true;

		if (checkEndTime >= startTime && checkEndTime < endTime) return true;

		return false;
	});

	if (!matchedLeave) {
		return {
			isLeave: false,
			reason: "no-leaves-matching",
			type: null,
			time: null,
		};
	}

	return {
		isLeave: true,
		reason: "one-leave-matched",
		type: matchedLeave.type,
		time: {
			start: matchedLeave.start,
			end: matchedLeave.end,
		},
	};
};
