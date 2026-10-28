"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	CalendarClockIcon,
	CalendarFoldIcon,
	CalendarX2Icon,
	GraduationCapIcon,
	UserRoundCogIcon,
} from "lucide-react";
import Link from "next/link";
import { getRangeTime } from "utils";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { getSlotStatusBadgeVariant } from "@/components/slot-details";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import { FetchUser } from "@/hooks/user";
import { snakeToTitleCase } from "@/lib/utils";

function LessonTitle({ lessonId }: { lessonId: string | null }) {
	return (
		<FetchLesson
			id={lessonId}
			isPending={<Skeleton className="h-4 w-28" />}
			notFound={<span>Session</span>}
		>
			{(lesson) => <span>{lesson.name}</span>}
		</FetchLesson>
	);
}

export default function Page() {
	const { data: teacher, isPending } = useQuery(
		api.core.self.teacher.queryOptions(),
	);
	const { data: students = [] } = useQuery(
		api.teacher.getStudents.queryOptions(),
	);
	const { data: slots = [] } = useQuery(api.core.slot.list.queryOptions());

	const now = Date.now();
	const upcoming = slots
		.filter(
			(slot) =>
				new Date(slot.expectedEndTime).getTime() >= now &&
				slot.status !== "attended",
		)
		.sort(
			(a, b) =>
				new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
		);
	const next = upcoming[0];
	const leaves = (teacher?.leaves ?? []).filter(
		(leave) => new Date(leave.end).getTime() >= now,
	);

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Dashboard</FrameTitle>
				<FrameDescription>
					Your sessions, students, and schedule
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<CalendarFoldIcon />
							</Button>
						)}
						<Button asChild variant="outline">
							<Link href="/teacher/leave">
								<CalendarX2Icon />
								Leave
							</Link>
						</Button>
						<Button asChild>
							<Link href="/teacher/availability">
								<CalendarFoldIcon />
								Availability
							</Link>
						</Button>
					</ButtonGroup>
				</FrameActions>
			</FrameHeader>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Next Session</FrameTitle>
					<FrameDescription>Your earliest booked session</FrameDescription>
				</FrameHeader>
				{next ? (
					<ItemGroup>
						<Item variant="outline">
							<ItemMedia variant="icon">
								<CalendarClockIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>
									<LessonTitle lessonId={next.lessonId} />
								</ItemTitle>
								<ItemDescription>
									{format(new Date(next.startTime), "EEE, MMM d · p")} –{" "}
									{format(new Date(next.expectedEndTime), "p")}
									{next.student?.user?.name &&
										` · Student: ${next.student.user.name}`}
								</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Badge variant={getSlotStatusBadgeVariant(next.status)}>
									{snakeToTitleCase(next.status)}
								</Badge>
								<Button asChild variant="ghost" size="sm">
									<Link href={`/slots/${next.id}` as "/"}>Details</Link>
								</Button>
							</ItemActions>
						</Item>
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<CalendarClockIcon />
							</EmptyMedia>
							<EmptyTitle>No upcoming session</EmptyTitle>
							<EmptyDescription>
								Your scheduler will book sessions that show up here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Upcoming Sessions</FrameTitle>
					<FrameDescription>Sessions booked from now on</FrameDescription>
				</FrameHeader>
				{upcoming.length > 0 ? (
					<ItemGroup>
						{upcoming.slice(0, 5).map((slot) => (
							<Item key={slot.id} variant="outline">
								<ItemMedia variant="icon">
									<CalendarClockIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>
										<LessonTitle lessonId={slot.lessonId} />
									</ItemTitle>
									<ItemDescription>
										{format(new Date(slot.startTime), "EEE, MMM d · p")} –{" "}
										{format(new Date(slot.expectedEndTime), "p")}
									</ItemDescription>
								</ItemContent>
								<ItemActions>
									<Badge variant={getSlotStatusBadgeVariant(slot.status)}>
										{snakeToTitleCase(slot.status)}
									</Badge>
								</ItemActions>
							</Item>
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>Nothing scheduled</EmptyTitle>
							<EmptyDescription>
								New bookings will show up here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Your Students</FrameTitle>
					<FrameDescription>Students you mentor</FrameDescription>
					<FrameActions>
						<Button asChild variant="outline" size="sm">
							<Link href="/students">
								<GraduationCapIcon />
								All Students
							</Link>
						</Button>
					</FrameActions>
				</FrameHeader>
				{students.length > 0 ? (
					<ItemGroup>
						{students.slice(0, 5).map((student) => (
							<Item key={student.id} variant="outline">
								<ItemMedia variant="icon">
									<GraduationCapIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>
										<FetchUser
											id={student.id}
											isPending={<Skeleton className="h-4 w-24" />}
										>
											{(user) => user.name}
										</FetchUser>
									</ItemTitle>
									<ItemDescription>
										{student.schooling
											? snakeToTitleCase(student.schooling)
											: null}
									</ItemDescription>
								</ItemContent>
								<ItemActions>
									<Button asChild variant="ghost" size="sm">
										<Link href={`/students/${student.id}` as "/"}>View</Link>
									</Button>
								</ItemActions>
							</Item>
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<GraduationCapIcon />
							</EmptyMedia>
							<EmptyTitle>No students assigned</EmptyTitle>
							<EmptyDescription>
								Students assigned to you as their mentor will show up here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Supervisor</FrameTitle>
					<FrameDescription>The scheduler you report to</FrameDescription>
				</FrameHeader>
				{teacher?.supervisorId ? (
					<ItemGroup>
						<Item variant="outline">
							<ItemMedia variant="icon">
								<UserRoundCogIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>
									<FetchUser
										id={teacher.supervisorId}
										isPending={<Skeleton className="h-4 w-24" />}
									>
										{(supervisor) => supervisor.name}
									</FetchUser>
								</ItemTitle>
								<ItemDescription>
									<FetchUser id={teacher.supervisorId}>
										{(supervisor) => supervisor.email}
									</FetchUser>
								</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Button asChild variant="ghost" size="sm">
									<Link href={`/schedulers/${teacher.supervisorId}` as "/"}>
										View
									</Link>
								</Button>
							</ItemActions>
						</Item>
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<UserRoundCogIcon />
							</EmptyMedia>
							<EmptyTitle>No supervisor assigned</EmptyTitle>
							<EmptyDescription>
								You have not been assigned to a scheduler yet.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Upcoming Leaves</FrameTitle>
					<FrameDescription>Your scheduled time off</FrameDescription>
					<FrameActions>
						<Button asChild variant="outline" size="sm">
							<Link href="/teacher/leave">Manage</Link>
						</Button>
					</FrameActions>
				</FrameHeader>
				{leaves.length > 0 ? (
					<ItemGroup>
						{leaves.map((leave) => (
							<Item key={`${leave.start}-${leave.end}`} variant="outline">
								<ItemMedia variant="icon">
									<CalendarX2Icon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{snakeToTitleCase(leave.type)}</ItemTitle>
									<ItemDescription>
										{getRangeTime(leave.start, leave.end)}
									</ItemDescription>
								</ItemContent>
							</Item>
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<CalendarX2Icon />
							</EmptyMedia>
							<EmptyTitle>No upcoming leaves</EmptyTitle>
							<EmptyDescription>
								Leaves you add will show up here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>
		</Frame>
	);
}
