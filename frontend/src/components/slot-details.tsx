"use client";

import { format } from "date-fns";
import { langFlag, langName } from "language-emoji";
import {
	BookOpenIcon,
	CalendarIcon,
	ClockIcon,
	ExternalLinkIcon,
	VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { formatTimeString } from "utils";
import { CopyButton } from "@/components/copy";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ZoomMeetingButton } from "@/components/zoom";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import { getInitials, snakeToTitleCase } from "@/lib/utils";

export type SlotRecord = API_Returns["core"]["slot"]["list"][number];

export function getSlotStatusBadgeVariant(status: string) {
	switch (status) {
		case "scheduled":
			return "info";
		case "started":
			return "purple";
		case "attended":
			return "success";
		case "rescheduled":
			return "warning";
		case "request_reschedule":
			return "destructive";
		default:
			return "default";
	}
}

export function SlotDetails({
	slot,
	showLinkButton = true,
}: {
	slot: SlotRecord;
	showLinkButton?: boolean;
}) {
	const startTime = new Date(slot.startTime);
	const expectedEndTime = new Date(slot.expectedEndTime);

	return (
		<div className="flex flex-col gap-4">
			{/* Lesson & Timing Details */}
			<div className="flex flex-col gap-2">
				<div className="flex items-start justify-between gap-2">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<BookOpenIcon className="size-4 text-muted-foreground" />
							<span className="font-semibold text-base">
								{slot.lesson?.name ?? "Untitled Session"}
							</span>
						</div>
						{slot.lesson?.description && (
							<p className="text-muted-foreground text-xs">
								{slot.lesson.description}
							</p>
						)}
					</div>
					<Badge variant={getSlotStatusBadgeVariant(slot.status)}>
						{snakeToTitleCase(slot.status)}
					</Badge>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{slot.lesson?.language && (
						<Badge variant="secondary" className="text-xs">
							{langFlag(slot.lesson.language)} {langName(slot.lesson.language)}
						</Badge>
					)}
					{slot.lesson?.period && (
						<Badge variant="outline" className="text-xs">
							{formatTimeString(slot.lesson.period)}
						</Badge>
					)}
				</div>
			</div>

			<Separator />

			{/* Schedule & Timing */}
			<Table>
				<TableBody>
					<TableRow>
						<TableCell className="w-28 font-medium text-muted-foreground">
							<div className="flex items-center gap-2">
								<CalendarIcon />
								<span>Date</span>
							</div>
						</TableCell>
						<TableCell className="font-medium">
							{format(startTime, "EEEE, MMMM d, yyyy")}
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="w-28 font-medium text-muted-foreground">
							<div className="flex items-center gap-2">
								<ClockIcon />
								<span>Time</span>
							</div>
						</TableCell>
						<TableCell>
							<span>
								{format(startTime, "p")} – {format(expectedEndTime, "p")}
							</span>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell className="w-28 font-medium text-muted-foreground">
							<div className="flex items-center gap-2">
								<VideoIcon />
								<span>Meeting</span>
							</div>
						</TableCell>
						<TableCell>
							<div className="flex items-center gap-2">
								<ZoomMeetingButton meetingLink={slot.meetingLink} />
								{slot.meetingLink && (
									<CopyButton
										text={() => slot.meetingLink ?? ""}
										label="Link"
										variant="ghost"
										size="icon-xs"
									/>
								)}
							</div>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>

			<Separator />

			{/* Participants: Student, Teacher, Scheduler */}
			<div className="flex flex-col gap-2">
				<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
					Participants
				</span>

				{/* Student */}
				{slot.student?.user ? (
					<Item variant="outline">
						<ItemMedia>
							<Avatar>
								{slot.student.user.image && (
									<AvatarImage
										src={slot.student.user.image}
										alt={slot.student.user.name}
									/>
								)}
								<AvatarFallback>
									{getInitials(slot.student.user.name)}
								</AvatarFallback>
							</Avatar>
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								<span>{slot.student.user.name}</span>
								<Badge variant="secondary" className="text-xs">
									Student
								</Badge>
							</ItemTitle>
							<ItemDescription>{slot.student.user.email}</ItemDescription>
						</ItemContent>
						{slot.studentId && (
							<ItemActions>
								<Button asChild variant="ghost" size="icon-sm">
									<Link href={`/students/${slot.studentId}`}>
										<ExternalLinkIcon />
									</Link>
								</Button>
							</ItemActions>
						)}
					</Item>
				) : slot.studentId ? (
					<FetchUser id={slot.studentId}>
						{(user) => (
							<Item variant="outline">
								<ItemMedia>
									<Avatar>
										{user.image && (
											<AvatarImage src={user.image} alt={user.name} />
										)}
										<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>
										<span>{user.name}</span>
										<Badge variant="secondary" className="text-xs">
											Student
										</Badge>
									</ItemTitle>
									<ItemDescription>{user.email}</ItemDescription>
								</ItemContent>
								<ItemActions>
									<Button asChild variant="ghost" size="icon-sm">
										<Link href={`/students/${slot.studentId}`}>
											<ExternalLinkIcon />
										</Link>
									</Button>
								</ItemActions>
							</Item>
						)}
					</FetchUser>
				) : null}

				{/* Teacher */}
				{slot.teacher?.user ? (
					<Item variant="outline">
						<ItemMedia>
							<Avatar>
								{slot.teacher.user.image && (
									<AvatarImage
										src={slot.teacher.user.image}
										alt={slot.teacher.user.name}
									/>
								)}
								<AvatarFallback>
									{getInitials(slot.teacher.user.name)}
								</AvatarFallback>
							</Avatar>
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								<span>{slot.teacher.user.name}</span>
								<Badge variant="secondary" className="text-xs">
									Teacher
								</Badge>
							</ItemTitle>
							<ItemDescription>{slot.teacher.user.email}</ItemDescription>
						</ItemContent>
						{slot.teacherId && (
							<ItemActions>
								<Button asChild variant="ghost" size="icon-sm">
									<Link href={`/teachers/${slot.teacherId}`}>
										<ExternalLinkIcon />
									</Link>
								</Button>
							</ItemActions>
						)}
					</Item>
				) : slot.teacherId ? (
					<FetchUser id={slot.teacherId}>
						{(user) => (
							<Item variant="outline">
								<ItemMedia>
									<Avatar>
										{user.image && (
											<AvatarImage src={user.image} alt={user.name} />
										)}
										<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>
										<span>{user.name}</span>
										<Badge variant="secondary" className="text-xs">
											Teacher
										</Badge>
									</ItemTitle>
									<ItemDescription>{user.email}</ItemDescription>
								</ItemContent>
								<ItemActions>
									<Button asChild variant="ghost" size="icon-sm">
										<Link href={`/teachers/${slot.teacherId}`}>
											<ExternalLinkIcon />
										</Link>
									</Button>
								</ItemActions>
							</Item>
						)}
					</FetchUser>
				) : null}

				{/* Scheduler */}
				{slot.schedulerId && (
					<FetchUser id={slot.schedulerId}>
						{(user) => (
							<Item variant="outline">
								<ItemMedia>
									<Avatar>
										{user.image && (
											<AvatarImage src={user.image} alt={user.name} />
										)}
										<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>
										<span>{user.name}</span>
										<Badge variant="secondary" className="text-xs">
											Scheduler
										</Badge>
									</ItemTitle>
									<ItemDescription>{user.email}</ItemDescription>
								</ItemContent>
							</Item>
						)}
					</FetchUser>
				)}
			</div>

			{/* Link to /slots/[id] (Feature 7) */}
			{showLinkButton && (
				<Button asChild className="mt-2 w-full">
					<Link href={`/slots/${slot.id}`}>
						<ExternalLinkIcon />
						View Full Session Page
					</Link>
				</Button>
			)}
		</div>
	);
}

export default SlotDetails;
