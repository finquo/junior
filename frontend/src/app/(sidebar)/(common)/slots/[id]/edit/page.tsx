"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LoadQuery } from "@/hooks/load";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { api } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";
import { CalenderPicker } from "../../_components/calender";
import { TimeCard } from "../../_components/time-card";
import { EditPreviewCard } from "./_components/preview-card";
import { EditUsersCard } from "./_components/users-card";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;

function toTimeValue(date: Date) {
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function EditSlot({ slot }: { slot: SlotData }) {
	const start = new Date(slot.startTime);
	const end = new Date(slot.expectedEndTime);

	const [teacherId, setTeacherId] = useState<string | null>(slot.teacherId);
	const [schedulerId, setSchedulerId] = useState<string | null>(
		slot.schedulerId,
	);
	const [date, setDate] = useState(
		new Date(start.getFullYear(), start.getMonth(), start.getDate()),
	);
	const [duration, setDuration] = useState(
		Math.round((end.getTime() - start.getTime()) / 60_000),
	);
	const [time, setTime] = useState(toTimeValue(start));

	const onDateChange = (d: Date | undefined) => {
		if (d) setDate(d);
	};

	const { data: teachers } = useQuery(api.core.teacher.list.queryOptions());

	const availability = teachers?.find(
		(teacher) => teacher.id === teacherId,
	)?.availability;

	const { data: check } = useQuery({
		...api.core.slot.check.queryOptions({
			input: {
				teacherId: teacherId ?? "",
				date,
				excludeSlotId: slot.id,
			},
		}),
		enabled: Boolean(teacherId && date),
	});

	return (
		<ResizablePanelGroup orientation="horizontal">
			<ResizablePanel className="p-3">
				<EditUsersCard
					slot={slot}
					teacherId={teacherId}
					onTeacherChange={setTeacherId}
					schedulerId={schedulerId}
					onSchedulerChange={setSchedulerId}
					duration={duration}
					onDurationChange={setDuration}
				/>
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel className="p-3">
				<CalenderPicker value={date} onChange={onDateChange} />
			</ResizablePanel>
			<ResizableHandle withHandle />
			<ResizablePanel>
				<div className="space-3">
					<div className="p-3">
						<TimeCard
							availability={availability}
							unavailable={check?.unavailable}
							duration={duration}
							date={date ?? null}
							time={time}
							onTimeChange={setTime}
						/>
					</div>
					<Separator />
					<div className="p-3">
						<EditPreviewCard
							slot={slot}
							teacherId={teacherId}
							schedulerId={schedulerId}
							date={date}
							duration={duration}
							time={time}
						/>
					</div>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Session"
			api={api.core.slot.get.queryOptions({ input: { id } })}
		>
			{(data) => <EditSlot key={data.id} slot={data} />}
		</LoadQuery>
	);
}
