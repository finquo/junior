"use client";

import {
	BookOpenIcon,
	CalendarDaysIcon,
	CalendarCheckIcon,
	ClockIcon,
	GraduationCapIcon,
	UserRoundIcon,
	UsersIcon,
} from "lucide-react";
import { parseAsInteger, parseAsIsoDate, useQueryState } from "nuqs";
import type { ReactNode } from "react";
import { sileo as toast } from "sileo";
import { mergeDateWithTimeString } from "utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
				<ItemGroup>
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
				<MutationButton
					api={api.core.slot.create.mutationOptions()}
					onSuccess={() => {
						refetchAPIs([api.core.slot.list.queryKey()]);
						toast.success({
							title: "Slot created successfully!",
						});
					}}
					isPending={
						<Button
							disabled
							className="w-full md:ml-auto md:w-auto"
							variant="outline"
						>
							<Spinner />
							Confirm
						</Button>
					}
					mutate={(mutate) => (
						<Button
							disabled={!isComplete}
							className="w-full md:ml-auto md:w-auto"
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
			</CardFooter>
		</Card>
	);
}
