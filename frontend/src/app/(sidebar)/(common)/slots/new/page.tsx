"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { api } from "@/hooks/api";
import { CalenderPicker } from "../_components/calender";
import { PreviewCard } from "../_components/preview-card";
import { TimeCard } from "../_components/time-card";
import { UsersCard } from "../_components/users-card";

export default function Pattern() {
	const [teacherId] = useQueryState("teacherId");
	const [date] = useQueryState("date", parseAsIsoDate);

	const { data: teachers } = useQuery(api.core.teacher.list.queryOptions());

	const availability = teachers?.find(
		(teacher) => teacher.id === teacherId,
	)?.availability;

	const { data: check } = useQuery({
		...api.core.slot.check.queryOptions({
			input: { teacherId: teacherId ?? "", date: date ?? new Date() },
		}),
		enabled: Boolean(teacherId && date),
	});

	return (
		<div className="flex flex-col flex-wrap gap-3 md:h-svh md:flex-row md:items-start">
			<div className="flex-1 space-y-3">
				<UsersCard />
				<TimeCard availability={availability} unavailable={check?.unavailable} />
			</div>

			<CalenderPicker />

			<div className="flex-1 space-y-3">
				<PreviewCard />
			</div>
		</div>
	);
}
