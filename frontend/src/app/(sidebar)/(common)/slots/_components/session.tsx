"use client";

import { programs } from "backend/config";
import { langFlag, langName } from "language-emoji";
import {
	CalendarClockIcon,
	CheckCheckIcon,
	ClockIcon,
	ExternalLinkIcon,
	GraduationCapIcon,
	LanguagesIcon,
	PlayIcon,
	UserRoundIcon,
	VideoIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { getDurationFromInterval } from "utils";
import {
	Timeline,
	TimelineContent,
	TimelineDate,
	TimelineHeader,
	TimelineIndicator,
	TimelineItem,
	TimelineSeparator,
	TimelineTitle,
} from "@/components/reui/timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FetchLesson } from "@/hooks/lesson";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import { getInitials, snakeToTitleCase } from "@/lib/utils";
import { SlotActions } from "./actions";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;

const statusVariant: Record<
	string,
	"info" | "success" | "warning" | "destructive" | "secondary"
> = {
	scheduled: "info",
	started: "success",
	rescheduled: "warning",
	request_reschedule: "destructive",
	attended: "secondary",
};

const statusStep: Record<string, number> = {
	scheduled: 1,
	request_reschedule: 1,
	rescheduled: 1,
	started: 2,
	attended: 3,
};

function formatDateTime(value: Date | string | null | undefined) {
	if (!value) return "—";
	return new Date(value).toLocaleString([], {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function ParticipantItem({
	label,
	userId,
	href,
}: {
	label: string;
	userId?: string | null;
	href: string;
}) {
	if (!userId) {
		return (
			<Item variant="outline">
				<ItemMedia variant="icon">
					<UserRoundIcon />
				</ItemMedia>
				<ItemContent>
					<ItemTitle>{label}</ItemTitle>
					<ItemDescription>Not assigned</ItemDescription>
				</ItemContent>
			</Item>
		);
	}

	return (
		<FetchUser
			id={userId}
			isPending={
				<Item variant="outline">
					<ItemMedia>
						<Skeleton className="size-8 rounded-full" />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{label}</ItemTitle>
						<Skeleton className="h-3 w-32" />
					</ItemContent>
				</Item>
			}
		>
			{(user) => (
				<Item variant="outline">
					<ItemMedia>
						<Avatar size="sm">
							<AvatarImage src={user.image ?? undefined} alt={user.name} />
							<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
						</Avatar>
					</ItemMedia>
					<ItemContent>
						<ItemTitle>{label}</ItemTitle>
						<ItemDescription>
							{user.name} · {user.email}
						</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Button variant="ghost" size="sm" asChild>
							<Link href={href as "/"}>
								View
								<ExternalLinkIcon />
							</Link>
						</Button>
					</ItemActions>
				</Item>
			)}
		</FetchUser>
	);
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
		<Item variant="muted">
			<ItemMedia variant="icon">{icon}</ItemMedia>
			<ItemContent>
				<ItemTitle>{label}</ItemTitle>
				<ItemDescription>{value}</ItemDescription>
			</ItemContent>
		</Item>
	);
}

export function SessionProfile({ data }: { data: SlotData }) {
	const start = new Date(data.startTime);
	const expectedEnd = new Date(data.expectedEndTime);
	const durationMinutes = Math.round(
		(expectedEnd.getTime() - start.getTime()) / 60_000,
	);
	const activeStep = statusStep[data.status] ?? 1;

	return (
		<Card>
			<CardHeader>
				<FetchLesson id={data.lessonId}>
					{(lesson) => (
						<>
							<CardTitle>{lesson.name}</CardTitle>
							<CardDescription>Session #{data.id.slice(0, 8)}</CardDescription>
						</>
					)}
				</FetchLesson>
				<ColorBadge variant={statusVariant[data.status] ?? "secondary"}>
					{snakeToTitleCase(data.status)}
				</ColorBadge>
				<Badge variant="outline">{durationMinutes} mins</Badge>

				<CardAction>
					<ButtonGroup>
						{data.meetingLink && (
							<Button variant="outline" size="sm" asChild>
								<a href={data.meetingLink} target="_blank" rel="noreferrer">
									<VideoIcon />
									Join
								</a>
							</Button>
						)}
						<SlotActions slot={data} />
					</ButtonGroup>
				</CardAction>
			</CardHeader>

			<CardContent>
				<Card size="sm">
					<CardHeader>
						<CardTitle>Session Progress</CardTitle>
						<CardDescription>
							Current lifecycle stage of this session.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Timeline defaultValue={activeStep}>
							<TimelineItem step={1}>
								<TimelineIndicator />
								<TimelineSeparator />
								<TimelineHeader>
									<TimelineDate>{formatDateTime(start)}</TimelineDate>
									<TimelineTitle>Scheduled</TimelineTitle>
								</TimelineHeader>
								<TimelineContent>
									Session booked for {durationMinutes} minutes.
								</TimelineContent>
							</TimelineItem>
							<TimelineItem step={2}>
								<TimelineIndicator>
									<PlayIcon />
								</TimelineIndicator>
								<TimelineSeparator />
								<TimelineHeader>
									<TimelineTitle>Started</TimelineTitle>
								</TimelineHeader>
								<TimelineContent>
									Teacher and student joined the live session.
								</TimelineContent>
							</TimelineItem>
							<TimelineItem step={3}>
								<TimelineIndicator>
									<CheckCheckIcon />
								</TimelineIndicator>
								<TimelineHeader>
									<TimelineDate>{formatDateTime(data.endTime)}</TimelineDate>
									<TimelineTitle>Attended</TimelineTitle>
								</TimelineHeader>
								<TimelineContent>Session marked as completed.</TimelineContent>
							</TimelineItem>
						</Timeline>
					</CardContent>
				</Card>

				<Card size="sm">
					<CardHeader>
						<CardTitle>Participants</CardTitle>
						<CardDescription>People involved in this session.</CardDescription>
					</CardHeader>
					<CardContent>
						<ItemGroup>
							<ParticipantItem
								label="Student"
								userId={data.studentId}
								href={`/students/${data.studentId}`}
							/>
							<ParticipantItem
								label="Teacher"
								userId={data.teacherId}
								href={`/teachers/${data.teacherId}`}
							/>
							<ParticipantItem
								label="Scheduler"
								userId={data.schedulerId}
								href={`/schedulers/${data.schedulerId}`}
							/>
						</ItemGroup>
					</CardContent>
				</Card>

				<Card size="sm">
					<CardHeader>
						<CardTitle>Schedule</CardTitle>
						<CardDescription>Timing details for this session.</CardDescription>
					</CardHeader>
					<CardContent>
						<ItemGroup>
							<DetailRow
								icon={<CalendarClockIcon />}
								label="Start Time"
								value={formatDateTime(start)}
							/>
							<DetailRow
								icon={<ClockIcon />}
								label="Expected End"
								value={formatDateTime(expectedEnd)}
							/>
							<DetailRow
								icon={<ClockIcon />}
								label="Actual End"
								value={formatDateTime(data.endTime)}
							/>
							<DetailRow
								icon={<ClockIcon />}
								label="Duration"
								value={`${durationMinutes} minutes`}
							/>
							<DetailRow
								icon={<CalendarClockIcon />}
								label="Created"
								value={formatDateTime(data.createdAt)}
							/>
						</ItemGroup>
					</CardContent>
				</Card>

				<Card size="sm">
					<CardHeader>
						<CardTitle>Lesson</CardTitle>
						<CardDescription>
							Curriculum covered in this session.
						</CardDescription>
						<CardAction>
							<Button variant="outline" size="sm" asChild>
								<Link href={`/lessons/${data.lessonId}` as "/"}>
									Open Lesson
									<ExternalLinkIcon />
								</Link>
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						<FetchLesson
							id={data.lessonId}
							isPending={
								<Item variant="muted">
									<ItemContent>
										<ItemTitle>Loading lesson…</ItemTitle>
									</ItemContent>
								</Item>
							}
							notFound={
								<Item variant="muted">
									<ItemContent>
										<ItemTitle>Lesson not found</ItemTitle>
									</ItemContent>
								</Item>
							}
						>
							{(lesson) => (
								<ItemGroup>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<GraduationCapIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>{lesson.name}</ItemTitle>
											<ItemDescription>
												{lesson.description ?? "No description"}
											</ItemDescription>
										</ItemContent>
										<Badge variant="secondary">
											{langFlag(lesson.language)} {langName(lesson.language)}
										</Badge>
									</Item>
									<DetailRow
										icon={<LanguagesIcon />}
										label="Program"
										value={
											programs.find((p) => p.id === lesson.program)?.name ??
											lesson.program
										}
									/>
									<DetailRow
										icon={<ClockIcon />}
										label="Lesson Duration"
										value={
											lesson.period
												? `${getDurationFromInterval(lesson.period)} minutes`
												: "—"
										}
									/>
								</ItemGroup>
							)}
						</FetchLesson>
					</CardContent>
				</Card>

				{data.meetingLink && (
					<Card size="sm">
						<CardHeader>
							<CardTitle>Meeting Link</CardTitle>
							<CardDescription>
								Share this link with participants to join the session.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Separator />
							<ButtonGroup>
								<Button variant="outline" size="sm" asChild>
									<a href={data.meetingLink} target="_blank" rel="noreferrer">
										<VideoIcon />
										Join Meeting
									</a>
								</Button>
								<Button variant="ghost" size="sm" asChild>
									<a href={data.meetingLink} target="_blank" rel="noreferrer">
										{data.meetingLink}
									</a>
								</Button>
							</ButtonGroup>
						</CardContent>
					</Card>
				)}
			</CardContent>
		</Card>
	);
}
