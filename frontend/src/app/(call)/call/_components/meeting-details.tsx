"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CalendarClockIcon,
	ClockIcon,
	ExternalLinkIcon,
	GraduationCapIcon,
	UserRoundIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Alert } from "@/components/arc/alert/alert";
import { Badge, type BadgeTone } from "@/components/arc/badge/badge";
import { Button as ArcButton } from "@/components/arc/button/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerFooter,
	DrawerInner,
} from "@/components/arc/drawer/drawer";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/arc/item/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import { snakeToTitleCase } from "@/lib/utils";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;

const statusTone: Record<string, BadgeTone> = {
	scheduled: "info",
	started: "success",
	rescheduled: "warning",
	request_reschedule: "danger",
	attended: "neutral",
};

function formatDateTime(value: Date | string | null | undefined) {
	if (!value) return "—";
	return new Date(value).toLocaleString([], {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function DetailRow({
	icon,
	label,
	value,
}: {
	icon: ReactNode;
	label: string;
	value: ReactNode;
}) {
	return (
		<Item variant="muted" size="xs">
			<ItemMedia variant="icon">{icon}</ItemMedia>
			<ItemContent>
				<ItemDescription>{label}</ItemDescription>
				<ItemTitle>{value}</ItemTitle>
			</ItemContent>
		</Item>
	);
}

function ParticipantRow({
	label,
	userId,
}: {
	label: string;
	userId: string | null;
}) {
	if (!userId) {
		return (
			<Item variant="muted" size="xs">
				<ItemMedia variant="icon">
					<UserRoundIcon />
				</ItemMedia>
				<ItemContent>
					<ItemDescription>{label}</ItemDescription>
					<ItemTitle>Not assigned</ItemTitle>
				</ItemContent>
			</Item>
		);
	}

	return (
		<FetchUser
			id={userId}
			isPending={
				<Item variant="muted" size="xs">
					<ItemMedia variant="icon">
						<Skeleton className="size-8 rounded-full" />
					</ItemMedia>
					<ItemContent>
						<ItemDescription>{label}</ItemDescription>
						<Skeleton className="h-3 w-28" />
					</ItemContent>
				</Item>
			}
			notFound={
				<Item variant="muted" size="xs">
					<ItemContent>
						<ItemDescription>{label}</ItemDescription>
						<ItemTitle>Not found</ItemTitle>
					</ItemContent>
				</Item>
			}
		>
			{(user) => (
				<Item variant="muted" size="xs">
					<ItemMedia variant="icon">
						<UserRoundIcon />
					</ItemMedia>
					<ItemContent>
						<ItemDescription>{label}</ItemDescription>
						<ItemTitle>{user.name}</ItemTitle>
					</ItemContent>
				</Item>
			)}
		</FetchUser>
	);
}

function DetailsContent({ data }: { data: SlotData }) {
	const start = new Date(data.startTime);
	const durationMinutes = Math.round(
		(new Date(data.expectedEndTime).getTime() - start.getTime()) / 60_000,
	);

	return (
		<>
			<ItemGroup>
				<a href={`/lessons/${data.lessonId}`} target="_blank" rel="noreferrer">
					<FetchLesson
						id={data.lessonId}
						isPending={
							<Item variant="outline">
								<ItemMedia variant="icon">
									<GraduationCapIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>Loading lesson…</ItemTitle>
									<Skeleton className="h-3 w-32" />
								</ItemContent>
							</Item>
						}
						notFound={
							<Item variant="outline">
								<ItemMedia variant="icon">
									<GraduationCapIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>Lesson not found</ItemTitle>
								</ItemContent>
							</Item>
						}
					>
						{(lesson) => (
							<Item variant="outline">
								<ItemMedia variant="icon">
									<GraduationCapIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{lesson.name}</ItemTitle>
									<ItemDescription>{lesson.description}</ItemDescription>
								</ItemContent>
								<Badge tone={statusTone[data.status] ?? "neutral"}>
									{snakeToTitleCase(data.status)}
								</Badge>
							</Item>
						)}
					</FetchLesson>
				</a>

				<DetailRow
					icon={<CalendarClockIcon />}
					label="Start time"
					value={formatDateTime(start)}
				/>
				<DetailRow
					icon={<ClockIcon />}
					label="Expected end"
					value={formatDateTime(data.expectedEndTime)}
				/>
				<DetailRow
					icon={<ClockIcon />}
					label="Actual end"
					value={formatDateTime(data.endTime)}
				/>
				<DetailRow
					icon={<ClockIcon />}
					label="Duration"
					value={`${durationMinutes} minutes`}
				/>
			</ItemGroup>
			<ItemGroup>
				<ParticipantRow label="Student" userId={data.studentId} />
				<ParticipantRow label="Teacher" userId={data.teacherId} />
				<ParticipantRow label="Scheduler" userId={data.schedulerId} />
			</ItemGroup>

			{data.meetingLink && (
				<DetailRow
					icon={<UserRoundIcon />}
					label="Meeting link"
					value={
						<a
							href={data.meetingLink}
							target="_blank"
							rel="noreferrer"
							className="underline underline-offset-4"
						>
							{data.meetingLink}
						</a>
					}
				/>
			)}
		</>
	);
}

function DetailsBody({ slotId }: { slotId: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.slot.get.queryOptions({ input: { id: slotId } }),
	);

	if (isPending) {
		return (
			<ItemGroup>
				{Array.from({ length: 4 }).map((_, index) => (
					<Item key={index as number} variant="muted" size="xs">
						<ItemMedia variant="icon">
							<Skeleton className="size-8 rounded-full" />
						</ItemMedia>
						<ItemContent>
							<Skeleton className="h-3 w-40" />
							<Skeleton className="h-3 w-24" />
						</ItemContent>
					</Item>
				))}
			</ItemGroup>
		);
	}

	if (isError || !data) {
		return (
			<Alert tone="danger" title="Meeting details unavailable">
				The details for this session could not be loaded.
			</Alert>
		);
	}

	return <DetailsContent data={data} />;
}

export function MeetingDetails({
	slotId,
	open,
	onOpenChange,
}: {
	slotId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent
				title="Meeting details"
				description="Session schedule, lesson, and participants."
				bodyClassName="flex flex-col gap-2"
			>
				<DrawerInner className="flex flex-col gap-2">
					<Alert title="Recording">
						This session is automatically recorded
					</Alert>
					<DetailsBody slotId={slotId} />
				</DrawerInner>
				<DrawerFooter>
					<ArcButton link={`/slots/${slotId}`} target="_blank" rel="noreferrer">
						<ExternalLinkIcon />
						Open Session Details
					</ArcButton>
					<DrawerClose asChild>
						<ArcButton variant="secondary">Close</ArcButton>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
