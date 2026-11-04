"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
	parseAsInteger,
	parseAsIsoDate,
	parseAsString,
	useQueryState,
	useQueryStates,
} from "nuqs";
import { useEffect, useRef } from "react";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
	const seeded = useRef(false);
	const [, setParams] = useQueryStates({
		studentId: parseAsString,
		teacherId: parseAsString,
		schedulerId: parseAsString,
		lessonId: parseAsString,
		duration: parseAsInteger,
		date: parseAsIsoDate,
		time: parseAsString,
	});

	useEffect(() => {
		if (seeded.current) return;
		seeded.current = true;

		const start = new Date(slot.startTime);
		const end = new Date(slot.expectedEndTime);

		setParams({
			studentId: slot.studentId,
			teacherId: slot.teacherId,
			schedulerId: slot.schedulerId,
			lessonId: slot.lessonId,
			duration: Math.round((end.getTime() - start.getTime()) / 60_000),
			date: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
			time: toTimeValue(start),
		});
	}, [slot, setParams]);

	const { data: teachers } = useQuery(api.core.teacher.list.queryOptions());
	const [teacherId] = useQueryState("teacherId");
	const [date] = useQueryState("date", parseAsIsoDate);

	const availability = teachers?.find(
		(teacher) => teacher.id === teacherId,
	)?.availability;

	const { data: check } = useQuery({
		...api.core.slot.check.queryOptions({
			input: {
				teacherId: teacherId ?? "",
				date: date ?? new Date(),
				excludeSlotId: slot.id,
			},
		}),
		enabled: Boolean(teacherId && date),
	});

	return (
		<ResizablePanelGroup orientation="horizontal">
			<ResizablePanel className="p-3">
				<EditUsersCard />
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
						<EditPreviewCard slotId={slot.id} />
					</div>
				</div>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

function Session({ slotId }: { slotId: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.slot.get.queryOptions({
			input: { id: slotId },
		}),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Session Not Found</AlertTitle>
				<AlertDescription>
					The requested session could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return <EditSlot slot={data} />;
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const slotId = params?.id;

	if (!slotId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Session ID</AlertTitle>
				<AlertDescription>
					No session identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Session slotId={slotId} />;
}
