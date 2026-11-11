"use client";

import { useMutation } from "@tanstack/react-query";
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
import { useHasRole } from "@/hooks/role";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;

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

export function EditPreviewCard({
	slot,
	teacherId,
	schedulerId,
	date,
	duration,
	time,
}: {
	slot: SlotData;
	teacherId: string | null;
	schedulerId: string | null;
	date: Date;
	duration: number;
	time: string;
}) {
	const router = useRouter();
	const isAdmin = useHasRole("admin");
	const adminSchedulerId = isAdmin ? (schedulerId ?? undefined) : undefined;

	const startTime = mergeDateWithTimeString(date, time);
	const expectedEndTime = new Date(startTime.getTime() + duration * 60_000);

	const timeChanged = Boolean(
		startTime.getTime() !== new Date(slot.startTime).getTime() ||
			expectedEndTime.getTime() !==
				new Date(slot.expectedEndTime).getTime(),
	);

	const reschedule = useMutation(
		api.core.slot.reschedule.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.slot.get.queryKey({ input: { id: slot.id } }),
					api.core.slot.list.queryKey(),
				]);
			},
		}),
	);

	const update = useMutation(
		api.core.slot.update.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.slot.get.queryKey({ input: { id: slot.id } }),
					api.core.slot.list.queryKey(),
				]);
				toast.success({
					title: "Session updated successfully!",
				});
				router.push(`/slots/${slot.id}` as "/");
			},
		}),
	);

	const isSaving = reschedule.isPending || update.isPending;

	const handleSave = async () => {
		if (!teacherId) return;

		try {
			if (timeChanged) {
				await reschedule.mutateAsync({
					id: slot.id,
					startTime,
					expectedEndTime,
				});
			}

			await update.mutateAsync({
				id: slot.id,
				teacherId,
				lessonId: slot.lessonId,
				schedulerId: adminSchedulerId,
			});
		} catch (error) {
			toast.error({
				title: "Could not save session",
				description: error instanceof Error ? error.message : undefined,
			});
		}
	};

	const isCheckDisabled = !teacherId;
	const dateWithTime = startTime;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Preview Changes</CardTitle>
				<CardDescription>Review the details before saving.</CardDescription>
				<CardAction>
					<Badge variant={teacherId ? "success" : "warning"}>
						{teacherId ? "Ready to save" : "Incomplete"}
					</Badge>
				</CardAction>
			</CardHeader>
			<CardContent>
				<ItemGroup className="grid grid-cols-2">
					<SummaryRow icon={<UserRoundIcon />} label="Student">
						<FetchUser
							id={slot.studentId}
							isPending={<Skeleton className="h-4 w-24" />}
						>
							{(user) => user.name}
						</FetchUser>
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
						<FetchLesson
							id={slot.lessonId}
							isPending={<Skeleton className="h-4 w-24" />}
						>
							{(lesson) => lesson.name}
						</FetchLesson>
					</SummaryRow>
					<SummaryRow icon={<CalendarDaysIcon />} label="Date">
						{date.toLocaleDateString("en-US", {
							weekday: "long",
							day: "numeric",
							month: "long",
						})}
					</SummaryRow>
					<SummaryRow icon={<ClockIcon />} label="Time">
						<span>{time}</span>
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
											if (!teacherId) return;
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
											if (!teacherId) return;
											mutate({
												teacherId,
												date: dateWithTime,
												period: duration,
												excludeSlotId: slot.id,
											});
										}}
									>
										Check Slot Availability
									</DropdownMenuItem>
								)}
							/>
						</DropdownMenuContent>
					</DropdownMenu>
					<Button disabled={!teacherId || isSaving} onClick={handleSave}>
						{isSaving ? <Spinner /> : <CalendarCheckIcon />}
						Save
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
