"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	ArrowRightIcon,
	BriefcaseBusinessIcon,
	CalendarClockIcon,
	CalendarHeartIcon,
	CircleAlertIcon,
	GraduationCapIcon,
	PlusIcon,
	UserRoundGroupIcon,
} from "lucide-react";
import Link from "next/link";
import { ProgramLink } from "@/components/program";
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
import { FetchUser } from "@/hooks/user";
import { snakeToTitleCase } from "@/lib/utils";

function CountItem({
	icon,
	label,
	count,
	isPending,
}: {
	icon: React.ReactNode;
	label: string;
	count: number | undefined;
	isPending: boolean;
}) {
	return (
		<Item variant="outline">
			<ItemMedia variant="icon">{icon}</ItemMedia>
			<ItemContent>
				<ItemTitle>{label}</ItemTitle>
				<ItemDescription>
					{isPending ? <Skeleton className="h-4 w-10" /> : count}
				</ItemDescription>
			</ItemContent>
		</Item>
	);
}

export default function Page() {
	const { data: students = [], isPending } = useQuery(
		api.core.student.list.queryOptions(),
	);
	const { data: teachers = [] } = useQuery(
		api.core.teacher.list.queryOptions(),
	);
	const { data: slots = [] } = useQuery(api.core.slot.list.queryOptions());

	const now = Date.now();
	const upcoming = slots
		.filter((slot) => new Date(slot.expectedEndTime).getTime() >= now)
		.sort(
			(a, b) =>
				new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
		);
	const needsAttention = upcoming.filter(
		(slot) =>
			slot.status === "request_reschedule" || slot.status === "rescheduled",
	);
	const next = upcoming.find(
		(slot) => slot.status === "scheduled" || slot.status === "started",
	);

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Dashboard</FrameTitle>
				<FrameDescription>
					Your students, teachers, and scheduled sessions
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						<Button asChild variant="outline">
							<Link href="/calender">
								<CalendarHeartIcon />
								Calendar
							</Link>
						</Button>
						<Button asChild>
							<Link href="/slots/new">
								<PlusIcon />
								New Session
							</Link>
						</Button>
					</ButtonGroup>
				</FrameActions>
			</FrameHeader>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Overview</FrameTitle>
					<FrameDescription>People and sessions under you</FrameDescription>
				</FrameHeader>
				<ItemGroup>
					<CountItem
						icon={<GraduationCapIcon />}
						label="Students"
						count={students.length}
						isPending={isPending}
					/>
					<CountItem
						icon={<BriefcaseBusinessIcon />}
						label="Teachers"
						count={teachers.length}
						isPending={isPending}
					/>
					<CountItem
						icon={<CalendarClockIcon />}
						label="Upcoming Sessions"
						count={upcoming.length}
						isPending={isPending}
					/>
					<CountItem
						icon={<CircleAlertIcon />}
						label="Needs Attention"
						count={needsAttention.length}
						isPending={isPending}
					/>
				</ItemGroup>
			</FramePanel>

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
									{next.lesson?.name ?? "Session"}
									{next.student?.user?.name && ` · ${next.student.user.name}`}
								</ItemTitle>
								<ItemDescription>
									{format(new Date(next.startTime), "EEE, MMM d · p")} –{" "}
									{format(new Date(next.expectedEndTime), "p")}
									{next.teacher?.user?.name &&
										` · Teacher: ${next.teacher.user.name}`}
								</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Badge variant={getSlotStatusBadgeVariant(next.status)}>
									{snakeToTitleCase(next.status)}
								</Badge>
								<Button asChild variant="ghost" size="sm">
									<Link href={`/slots/${next.id}` as "/"}>
										Details
										<ArrowRightIcon />
									</Link>
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
								Create a session to get your students learning.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Needs Attention</FrameTitle>
					<FrameDescription>
						Sessions requested for reschedule or already moved
					</FrameDescription>
				</FrameHeader>
				{needsAttention.length > 0 ? (
					<ItemGroup>
						{needsAttention.map((slot) => (
							<Item key={slot.id} variant="outline">
								<ItemMedia variant="icon">
									<CircleAlertIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>
										{slot.lesson?.name ?? "Session"}
										{slot.student?.user?.name && ` · ${slot.student.user.name}`}
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
									<Button asChild variant="outline" size="sm">
										<Link href={`/slots/${slot.id}` as "/"}>
											Review
											<ArrowRightIcon />
										</Link>
									</Button>
								</ItemActions>
							</Item>
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<CalendarClockIcon />
							</EmptyMedia>
							<EmptyTitle>Nothing to review</EmptyTitle>
							<EmptyDescription>
								All sessions are on track. Reschedule requests will show up
								here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Your Students</FrameTitle>
					<FrameDescription>Students assigned to you</FrameDescription>
					<FrameActions>
						<Button asChild variant="outline" size="sm">
							<Link href="/students">
								<UserRoundGroupIcon />
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
										<ProgramLink id={student.program} />
									</ItemDescription>
								</ItemContent>
								<ItemActions>
									<Button asChild variant="ghost" size="sm">
										<Link href={`/students/${student.id}` as "/"}>
											View
											<ArrowRightIcon />
										</Link>
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
								Students assigned to you by the admin will show up here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Your Teachers</FrameTitle>
					<FrameDescription>Teachers you supervise</FrameDescription>
					<FrameActions>
						<Button asChild variant="outline" size="sm">
							<Link href="/teachers">
								<UserRoundGroupIcon />
								All Teachers
							</Link>
						</Button>
					</FrameActions>
				</FrameHeader>
				{teachers.length > 0 ? (
					<ItemGroup>
						{teachers.slice(0, 5).map((teacher) => (
							<Item key={teacher.id} variant="outline">
								<ItemMedia variant="icon">
									<BriefcaseBusinessIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{teacher.user?.name ?? teacher.id}</ItemTitle>
									{teacher.user?.email && (
										<ItemDescription>{teacher.user.email}</ItemDescription>
									)}
								</ItemContent>
								<ItemActions>
									<Button asChild variant="ghost" size="sm">
										<Link href={`/teachers/${teacher.id}` as "/"}>
											View
											<ArrowRightIcon />
										</Link>
									</Button>
								</ItemActions>
							</Item>
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<BriefcaseBusinessIcon />
							</EmptyMedia>
							<EmptyTitle>No teachers assigned</EmptyTitle>
							<EmptyDescription>
								Teachers assigned to you by the admin will show up here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>
		</Frame>
	);
}
