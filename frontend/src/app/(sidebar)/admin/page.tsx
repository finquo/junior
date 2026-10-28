"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	ArrowRightIcon,
	BookOpenCheckIcon,
	BriefcaseBusinessIcon,
	CalendarClockIcon,
	CalendarHeartIcon,
	ComponentIcon,
	ExternalLinkIcon,
	GraduationCapIcon,
	PlusIcon,
	UserRoundCogIcon,
	UserRoundGroupIcon,
} from "lucide-react";
import Link from "next/link";
import { getRelateTime } from "utils";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { getSlotStatusBadgeVariant } from "@/components/slot-details";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";
import { snakeToTitleCase } from "@/lib/utils";

type UserRecord = API_Returns["admin"]["getUsers"][number];
type SlotRecord = API_Returns["core"]["slot"]["list"][number];

function roleProfilePath(role: UserRecord["role"], id: string) {
	return role === "teacher"
		? (`/teachers/${id}` as "/")
		: role === "student"
			? (`/students/${id}` as "/")
			: role === "scheduler"
				? (`/schedulers/${id}` as "/")
				: null;
}

const roleIcons = {
	admin: <UserRoundGroupIcon />,
	scheduler: <UserRoundCogIcon />,
	teacher: <BriefcaseBusinessIcon />,
	student: <GraduationCapIcon />,
} as const;

function RoleLabel({ role }: { role: UserRecord["role"] }) {
	return (
		<Badge variant="secondary">
			{role ? roleIcons[role as keyof typeof roleIcons] : null}
			{role ? <span>{snakeToTitleCase(role)}</span> : "Unassigned"}
		</Badge>
	);
}

function UserCountItem({
	icon,
	label,
	count,
	href,
	isPending,
}: {
	icon: React.ReactNode;
	label: string;
	count: number | undefined;
	href: string;
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
			<ItemActions>
				<Button asChild variant="ghost" size="sm">
					<Link href={href as "/"}>
						View
						<ArrowRightIcon />
					</Link>
				</Button>
			</ItemActions>
		</Item>
	);
}

function SessionItem({ slot }: { slot: SlotRecord }) {
	return (
		<Item variant="outline">
			<ItemMedia variant="icon">
				<CalendarClockIcon />
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
				<Button asChild variant="ghost" size="sm">
					<Link href={`/slots/${slot.id}` as "/"}>
						Details
						<ArrowRightIcon />
					</Link>
				</Button>
			</ItemActions>
		</Item>
	);
}

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.admin.getUsers.queryOptions({ input: {} }),
	);
	const { data: slots = [] } = useQuery(api.core.slot.list.queryOptions());

	const students = data.filter((user) => user.role === "student").length;
	const teachers = data.filter((user) => user.role === "teacher").length;
	const schedulers = data.filter((user) => user.role === "scheduler").length;

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
		)
		.slice(0, 5);

	const recent = [...data]
		.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)
		.slice(0, 5);

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Dashboard</FrameTitle>
				<FrameDescription>Platform overview and quick actions</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button asChild>
							<Link href="/admin/users/new">
								<PlusIcon />
								Create User
							</Link>
						</Button>
					</ButtonGroup>
				</FrameActions>
			</FrameHeader>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Overview</FrameTitle>
					<FrameDescription>People on the platform right now</FrameDescription>
				</FrameHeader>
				<ItemGroup>
					<UserCountItem
						icon={<UserRoundGroupIcon />}
						label="Users"
						count={data.length}
						href="/admin/users"
						isPending={isPending}
					/>
					<UserCountItem
						icon={<GraduationCapIcon />}
						label="Students"
						count={students}
						href="/students"
						isPending={isPending}
					/>
					<UserCountItem
						icon={<BriefcaseBusinessIcon />}
						label="Teachers"
						count={teachers}
						href="/teachers"
						isPending={isPending}
					/>
					<UserCountItem
						icon={<UserRoundCogIcon />}
						label="Schedulers"
						count={schedulers}
						href="/schedulers"
						isPending={isPending}
					/>
				</ItemGroup>
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Upcoming Sessions</FrameTitle>
					<FrameDescription>The next sessions on the calendar</FrameDescription>
					<FrameActions>
						<Button asChild variant="outline" size="sm">
							<Link href="/calender">
								<CalendarHeartIcon />
								Calendar
							</Link>
						</Button>
					</FrameActions>
				</FrameHeader>
				{upcoming.length > 0 ? (
					<ItemGroup>
						{upcoming.map((slot) => (
							<SessionItem key={slot.id} slot={slot} />
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<CalendarClockIcon />
							</EmptyMedia>
							<EmptyTitle>No upcoming sessions</EmptyTitle>
							<EmptyDescription>
								Sessions scheduled on the calendar will show up here.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Recent Members</FrameTitle>
					<FrameDescription>
						The latest people to join the platform
					</FrameDescription>
					<FrameActions>
						<Button asChild variant="outline" size="sm">
							<Link href="/admin/users">
								<ExternalLinkIcon />
								All Users
							</Link>
						</Button>
					</FrameActions>
				</FrameHeader>
				{recent.length > 0 ? (
					<ItemGroup>
						{recent.map((user) => {
							const path = roleProfilePath(user.role, user.id);
							return (
								<Item key={user.id} variant="outline">
									<ItemMedia>
										<Avatar size="sm">
											<AvatarImage
												src={user.image ?? undefined}
												alt={user.name ?? "User"}
											/>
											<AvatarFallback>{user.name?.[0] ?? "U"}</AvatarFallback>
										</Avatar>
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{user.name ?? "Unnamed user"}</ItemTitle>
										{user.email && (
											<ItemDescription>{user.email}</ItemDescription>
										)}
									</ItemContent>
									<ItemActions>
										<RoleLabel role={user.role} />
										<span className="text-muted-foreground text-xs">
											{getRelateTime(new Date(user.createdAt))} ago
										</span>
										{path && (
											<Button asChild variant="ghost" size="icon-sm">
												<Link href={path}>
													<ExternalLinkIcon />
												</Link>
											</Button>
										)}
									</ItemActions>
								</Item>
							);
						})}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<UserRoundGroupIcon />
							</EmptyMedia>
							<EmptyTitle>No users yet</EmptyTitle>
							<EmptyDescription>
								Create the first user to get the platform running.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Quick Links</FrameTitle>
					<FrameDescription>Jump into the management pages</FrameDescription>
				</FrameHeader>
				<ItemGroup>
					<Item variant="outline">
						<ItemMedia variant="icon">
							<UserRoundGroupIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Users Management</ItemTitle>
							<ItemDescription>
								Create accounts and manage role assignments
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button asChild variant="outline" size="sm">
								<Link href="/admin/users">
									Open
									<ArrowRightIcon />
								</Link>
							</Button>
						</ItemActions>
					</Item>

					<Item variant="outline">
						<ItemMedia variant="icon">
							<ComponentIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Programs</ItemTitle>
							<ItemDescription>
								Curriculum programs and regional pricing
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button asChild variant="outline" size="sm">
								<Link href="/programs">
									Open
									<ArrowRightIcon />
								</Link>
							</Button>
						</ItemActions>
					</Item>

					<Item variant="outline">
						<ItemMedia variant="icon">
							<BookOpenCheckIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Lessons</ItemTitle>
							<ItemDescription>
								Curriculum lessons attached to programs
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button asChild variant="outline" size="sm">
								<Link href="/lessons">
									Open
									<ArrowRightIcon />
								</Link>
							</Button>
						</ItemActions>
					</Item>

					<Item variant="outline">
						<ItemMedia variant="icon">
							<CalendarHeartIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Calendar</ItemTitle>
							<ItemDescription>
								All scheduled sessions at a glance
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button asChild variant="outline" size="sm">
								<Link href="/calender">
									Open
									<ArrowRightIcon />
								</Link>
							</Button>
						</ItemActions>
					</Item>
				</ItemGroup>
			</FramePanel>
		</Frame>
	);
}
