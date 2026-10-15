"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { langFlag, langName } from "language-emoji";
import {
	InfoIcon,
	PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { formatTimeString } from "utils";
import { EventCalendar } from "@/components/reui/event-calendar/event-calendar";
import { EventCalendarContent } from "@/components/reui/event-calendar/event-calendar-content";
import {
	EventCalendarNav,
	EventCalendarNavNext,
	EventCalendarNavPrev,
	EventCalendarNavToday,
	EventCalendarTitle,
	EventCalendarViewSwitcher,
} from "@/components/reui/event-calendar/event-calendar-nav";
import type { CalendarEvent } from "@/components/reui/event-calendar/event-calendar-types";
import {
	Frame,
	FrameActions,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import {
	getSlotStatusBadgeVariant,
	SlotDetails,
	type SlotRecord,
} from "@/components/slot-details";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/hooks/api";
import { snakeToTitleCase } from "@/lib/utils";

function getSlotEventColor(status: string): string {
	switch (status) {
		case "scheduled":
			return "blue";
		case "started":
			return "purple";
		case "attended":
			return "emerald";
		case "rescheduled":
			return "amber";
		case "request_reschedule":
			return "red";
		default:
			return "blue";
	}
}

export default function CalendarPage() {
	const { data: slots = [] } = useQuery(
		api.core.slot.list.queryOptions(),
	);

	const [selectedSlot, setSelectedSlot] = useState<SlotRecord | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const calendarEvents: CalendarEvent<SlotRecord>[] = useMemo(() => {
		return slots.map((slot) => {
			const studentName = slot.student?.user?.name;
			const lessonName = slot.lesson?.name ?? "Session";
			const title = studentName ? `${lessonName} · ${studentName}` : lessonName;

			return {
				id: slot.id,
				title,
				start: new Date(slot.startTime),
				end: new Date(slot.expectedEndTime),
				allDay: false,
				readOnly: true,
				draggable: false,
				resizable: false,
				color: getSlotEventColor(slot.status),
				data: slot,
			};
		});
	}, [slots]);

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Calendar</FrameTitle>
				<FrameActions>
					<Button asChild size="sm">
						<Link href="/slots/new">
							<PlusIcon className="size-4" />
							New Slot
						</Link>
					</Button>
				</FrameActions>
			</FrameHeader>

			<FramePanel>
				<EventCalendar<SlotRecord>
					events={calendarEvents}
					defaultView="week"
					className="h-[calc(100vh-12rem)] min-h-[600px]"
					interactions={{
						drag: false,
						resize: false,
						selectSlot: false,
					}}
					onEventClick={(occurrence, e) => {
						e.preventDefault();
						if (occurrence.event.data) {
							setSelectedSlot(occurrence.event.data);
							setIsDialogOpen(true);
						}
					}}
					renderAgendaEvent={({ occurrence }) => {
						const slot = occurrence.event.data as SlotRecord;
						if (!slot) return null;
						const startTime = new Date(slot.startTime);
						const expectedEndTime = new Date(slot.expectedEndTime);
						const studentUser = slot.student?.user;
						const teacherUser = slot.teacher?.user;

						return (
							<div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 py-1">
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<span className="w-36 shrink-0 font-medium text-muted-foreground text-xs tabular-nums">
										{format(startTime, "p")} – {format(expectedEndTime, "p")}
									</span>
									<span
										aria-hidden
										className="size-2 shrink-0 rounded-full"
										style={{
											backgroundColor: `var(--color-${occurrence.event.color}-500, var(--ec-event-color))`,
										}}
									/>
									<div className="flex min-w-0 flex-1 flex-col">
										<div className="flex flex-wrap items-center gap-2">
											<span className="truncate font-semibold text-sm">
												{slot.lesson?.name ?? "Session"}
											</span>
											{slot.lesson?.language && (
												<Badge variant="secondary" className="text-xs">
													{langFlag(slot.lesson.language)}{" "}
													{langName(slot.lesson.language)}
												</Badge>
											)}
											{slot.lesson?.period && (
												<Badge variant="outline" className="text-xs">
													{formatTimeString(slot.lesson.period)}
												</Badge>
											)}
										</div>
										<div className="flex items-center gap-3 text-muted-foreground text-xs">
											{studentUser && (
												<span className="truncate">
													<span className="font-medium">Student:</span>{" "}
													{studentUser.name}
												</span>
											)}
											{teacherUser && (
												<span className="truncate">
													<span className="font-medium">Teacher:</span>{" "}
													{teacherUser.name}
												</span>
											)}
										</div>
									</div>
								</div>

								<div className="flex shrink-0 items-center gap-2">
									<Badge variant={getSlotStatusBadgeVariant(slot.status)}>
										{snakeToTitleCase(slot.status)}
									</Badge>
									<Button
										variant="ghost"
										size="icon-xs"
										onClick={(e) => {
											e.stopPropagation();
											setSelectedSlot(slot);
											setIsDialogOpen(true);
										}}
									>
										<InfoIcon className="size-3.5" />
									</Button>
								</div>
							</div>
						);
					}}
					renderAgendaEventDetails={(occurrence) => {
						const slot = occurrence.event.data as SlotRecord;
						if (!slot) return null;
						return (
							<div className="border-t bg-muted/20 p-4">
								<SlotDetails slot={slot} />
							</div>
						);
					}}
				>
					<EventCalendarNav>
						<EventCalendarNavToday />
						<EventCalendarViewSwitcher />
						<div className="flex items-center">
							<EventCalendarNavPrev />
							<EventCalendarNavNext />
						</div>
						<EventCalendarTitle className="ms-3" />
						<div className="grow" />
						<Button asChild size="sm" variant="outline" className="me-2">
							<Link href="/slots/new">
								<PlusIcon className="size-4" />
								New Slot
							</Link>
						</Button>
					</EventCalendarNav>
					<EventCalendarContent />
				</EventCalendar>
			</FramePanel>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Session Details</DialogTitle>
						<DialogDescription>
							Slot information and assigned participants
						</DialogDescription>
					</DialogHeader>
					{selectedSlot && <SlotDetails slot={selectedSlot} />}
				</DialogContent>
			</Dialog>
		</Frame>
	);
}