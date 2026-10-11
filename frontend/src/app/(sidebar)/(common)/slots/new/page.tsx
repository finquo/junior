"use client";

import { CalenderPicker } from "../_components/calender";
import { PreviewCard } from "../_components/preview-card";
import { TimeCard } from "../_components/time-card";
import { UsersCard } from "../_components/users-card";

export default function Pattern() {
	return (
		<div className="flex flex-col flex-wrap gap-3 md:h-svh md:flex-row md:items-start">
			<div className="flex-1 space-y-3">
				<UsersCard />
				<TimeCard />
			</div>

			<CalenderPicker />

			<div className="flex-1 space-y-3">
				<PreviewCard />
			</div>
		</div>
	);
}
