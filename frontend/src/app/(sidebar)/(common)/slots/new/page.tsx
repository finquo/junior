"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { api } from "@/hooks/api";
import { CalenderPicker } from "../_components/calender";
import { PreviewCard } from "../_components/preview-card";
import { TimeCard } from "../_components/time-card";
import { UsersCard } from "../_components/users-card";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";

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
		<ResizablePanelGroup orientation="horizontal">
			<ResizablePanel className="p-3">
				<UsersCard />
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel className="p-3">
				<CalenderPicker />
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel>
				<div className="space-3">
					<div className="p-3">
						<TimeCard
							availability={availability}
							unavailable={check?.unavailable}
						/>
					</div>
					<Separator />
					<div className="p-3">
						<PreviewCard />
					</div>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
