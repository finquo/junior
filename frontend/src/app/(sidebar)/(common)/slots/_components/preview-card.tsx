"use client";

import {
	BookOpenIcon,
	CalendarCheckIcon,
	CalendarDaysIcon,
	ClockIcon,
	EllipsisIcon,
	GraduationCapIcon,
	UserRoundIcon,
	UsersIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsInteger, parseAsIsoDate, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { sileo as toast } from "sileo";
import { mergeDateWithTimeString } from "utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import { FetchLesson } from "@/hooks/lesson";
import { FetchUser } from "@/hooks/user";

function SummaryRow({
	icon,
	label,
	children,
}: {
	icon: ReactNode;
	label: string;
	children: ReactNode;
}) {
	return (
		<Item variant="muted" size="xs">
			<ItemMedia variant="icon">{icon}</ItemMedia>
			<ItemContent>
				<ItemDescription>{label}</ItemDescription>
				<ItemTitle>{children}</ItemTitle>
			</ItemContent>
		</Item>
	);
}

function NotSelected() {
	return <Badge variant="outline">Not selected</Badge>;
}

export function PreviewCard() {
	const router = useRouter();
	const [studentId] = useQueryState("studentId");
	const [teacherId] = useQueryState("teacherId");
	const [schedulerId] = useQueryState("schedulerId");
	const [lessonId] = useQueryState("lessonId");
	const [duration] = useQueryState("duration", parseAsInteger.withDefault(25));
	const [date] = useQueryState("date", parseAsIsoDate);
	const [selectedTime] = useQueryState("time", {
		defaultValue: "10:00",
	});

	const isComplete = Boolean(
		studentId && teacherId && schedulerId && lessonId && date && selectedTime,
	);

	const formattedDate = date?.toLocaleDateString("en-US", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	const isCheckDisabled = Boolean(!teacherId || !date);

	const dateWithTime = date
		? selectedTime
			? mergeDateWithTimeString(date, selectedTime)
			: date
		: new Date();

	return (
		<Card>
			<CardHeader>
				<CardTitle>Preview Schedule</CardTitle>
				<CardDescription>Review the details before confirming.</CardDescription>
				<CardAction>
					<Badge variant={isComplete ? "success" : "warning"}>
						{isComplete ? "Ready to confirm" : "Incomplete"}
					</Badge>
				</CardAction>
			</CardHeader>
			<CardContent>
				<ItemGroup className="grid grid-cols-2">
					<SummaryRow icon={<UserRoundIcon />} label="Student">
						{studentId ? (
							<FetchUser
								id={studentId}
								isPending={<Skeleton className="h-4 w-24" />}
							>
								{(user) => user.name}
							</FetchUser>
						) : (
							<NotSelected />
						)}
					</SummaryRow>
					<SummaryRow icon={<GraduationCapIcon />} label="Teacher">
						{teacherId ? (
							<FetchUser
								id={teacherId}
								isPending={<Skeleton className="h-4 w-24" />}
							>
								{(user) => user.name}
							</FetchUser>
						) : (
							<NotSelected />
						)}
					</SummaryRow>
					<SummaryRow icon={<UsersIcon />} label="Scheduler">
						{schedulerId ? (
							<FetchUser
								id={schedulerId}
								isPending={<Skeleton className="h-4 w-24" />}
							>
								{(user) => user.name}
							</FetchUser>
						) : (
							<NotSelected />
						)}
					</SummaryRow>
					<SummaryRow icon={<BookOpenIcon />} label="Lesson">
						{lessonId ? (
							<FetchLesson
								id={lessonId}
								isPending={<Skeleton className="h-4 w-24" />}
							>
								{(lesson) => lesson.name}
							</FetchLesson>
						) : (
							<NotSelected />
						)}
					</SummaryRow>
					<SummaryRow icon={<CalendarDaysIcon />} label="Date">
						{formattedDate ?? <NotSelected />}
					</SummaryRow>
					<SummaryRow icon={<ClockIcon />} label="Time">
						<span>{selectedTime}</span>
						<Badge variant="secondary">{duration} mins</Badge>
					</SummaryRow>
				</ItemGroup>
			</CardContent>
			<CardFooter className="justify-end">
				<ButtonGroup>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="secondary"
								size="icon"
								disabled={isCheckDisabled}
								aria-label="Availability checks"
							>
								<EllipsisIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuLabel>Availability checks</DropdownMenuLabel>
							<MutationButton
								api={api.core.teacher.checkAvailability.mutationOptions()}
								onSuccess={(result) => {
									if (result.isAvailable) {
										toast.success({
											title: "Teacher is available!",
											description:
												"Teacher is available on this date for the selected duration.",
										});
									} else {
										toast.warning({
											title: "Teacher is unavailable",
											description:
												result.reason ||
												"Teacher is not available for this period.",
										});
									}
								}}
								isPending={
									<DropdownMenuItem disabled>
										<Spinner />
										Checking Teacher Availability...
									</DropdownMenuItem>
								}
								mutate={(mutate) => (
									<DropdownMenuItem
										onSelect={() => {
											if (!teacherId || !date) return;
											mutate({
												id: teacherId,
												date: dateWithTime,
												period: duration,
											});
										}}
									>
										Check Teacher Availability
									</DropdownMenuItem>
								)}
							/>
							<MutationButton
								api={api.core.slot.checkAvailability.mutationOptions()}
								onSuccess={(result) => {
									if (result.existingSlots && result.existingSlots.length > 0) {
										toast.warning({
											title: "Slot conflict detected",
											description: `${result.existingSlots.length} active slot(s) already booked during this time.`,
										});
									} else {
										toast.success({
											title: "Slot is available!",
											description: "No conflicting slots found for this time.",
										});
									}
								}}
								isPending={
									<DropdownMenuItem disabled>
										<Spinner />
										Checking Slot Availability...
									</DropdownMenuItem>
								}
								mutate={(mutate) => (
									<DropdownMenuItem
										disabled={isCheckDisabled}
										onSelect={() => {
											if (!teacherId || !date) return;
											mutate({
												teacherId,
												date: dateWithTime,
												period: duration,
											});
										}}
									>
										Check Slot Availability
									</DropdownMenuItem>
								)}
							/>
						</DropdownMenuContent>
					</DropdownMenu>
					<MutationButton
						api={api.core.slot.create.mutationOptions()}
						onSuccess={(created) => {
							refetchAPIs([api.core.slot.list.queryKey()]);
							toast.success({
								title: "Slot created successfully!",
							});
							const slot = created?.[0];
							if (slot) router.push(`/slots/${slot.id}` as "/");
						}}
						isPending={
							<Button disabled variant="outline">
								<Spinner />
								Confirm
							</Button>
						}
						mutate={(mutate) => (
							<Button
								disabled={!isComplete}
								onClick={() => {
									if (
										!studentId ||
										!teacherId ||
										!schedulerId ||
										!lessonId ||
										!date ||
										!selectedTime
									) {
										return;
									}

									const startTime = mergeDateWithTimeString(date, selectedTime);

									mutate({
										studentId,
										teacherId,
										schedulerId,
										lessonId,
										startTime,
										period: duration,
									});
								}}
							>
								<CalendarCheckIcon />
								Confirm
							</Button>
						)}
					/>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
