import { sileo as toast } from "sileo";
import { mergeDateWithTimeString } from "utils";
import { create } from "zustand";
import type { API_Params } from "@/lib/api";

type AddLeaveInput = API_Params["teacher"]["addLeave"];

type LeaveType = AddLeaveInput["type"];

type AddLeave = (input: AddLeaveInput) => void | Promise<void>;

type LeaveFormState = {
	type: LeaveType;
	startDate?: Date;
	endDate?: Date;
	startTime?: string;
	endTime?: string;

	setType: (type: LeaveType) => void;
	setStartDate: (date?: Date) => void;
	setEndDate: (date?: Date) => void;
	setStartTime: (time?: string) => void;
	setEndTime: (time?: string) => void;

	handleFullConfirm: (addLeave: AddLeave) => Promise<void>;
	handleMultipleConfirm: (addLeave: AddLeave) => Promise<void>;
	handlePartialConfirm: (addLeave: AddLeave) => Promise<void>;

	handleConfirm: (type: LeaveType, addLeave: AddLeave) => Promise<void>;
	resetLeaveForm: () => void;
};

export const useLeaveForm = create<LeaveFormState>((set, get, init) => ({
	type: "full",
	startDate: undefined,
	endDate: undefined,
	startTime: undefined,
	endTime: undefined,

	setType: (type) => set({ type }),
	setStartDate: (startDate) => set({ startDate }),
	setEndDate: (endDate) => set({ endDate }),
	setStartTime: (startTime) => set({ startTime }),
	setEndTime: (endTime) => set({ endTime }),

	handleFullConfirm: async (addLeave) => {
		const { startDate } = get();

		if (!startDate) return;

		await addLeave({ type: "full", start: startDate });
	},

	handleMultipleConfirm: async (addLeave) => {
		const { startDate, endDate } = get();

		if (!startDate || !endDate) return;

		await addLeave({ type: "multiple", start: startDate, end: endDate });
	},

	handlePartialConfirm: async (addLeave) => {
		const { startDate, startTime, endTime } = get();

		if (!startDate || !startTime || !endTime) return;

		const start = mergeDateWithTimeString(startDate, startTime);
		const end = mergeDateWithTimeString(startDate, endTime);

		if (end.getTime() <= start.getTime()) {
			toast.error({
				title: "End time must be after start time",
			});
			return;
		}

		await addLeave({ type: "partial", start, end });
	},

	handleConfirm: async (t, addLeave) => {
		const { handleFullConfirm, handleMultipleConfirm, handlePartialConfirm } =
			get();
		switch (t) {
			case "full":
				return handleFullConfirm(addLeave);
			case "multiple":
				return handleMultipleConfirm(addLeave);
			case "partial":
				return handlePartialConfirm(addLeave);
		}
	},

	resetLeaveForm: () => set(init.getInitialState()),
}));
