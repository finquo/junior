"use client";

import { useMutation } from "@tanstack/react-query";
import { CircleCheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { sileo as toast } from "sileo";
import { dayKeys, type Availability } from "backend/config";
import {
	AvailabilityScheduler,
	defaultWeek,
	type WeekAvailability,
} from "@/components/availability";
import { Frame } from "@/components/reui/frame";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	ButtonGroup,
	ButtonGroupSeparator,
} from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { api } from "@/hooks/api";
import { getUserData } from "@/hooks/user";
import { getNextDayOfWeek, getToday, getTomorrow } from "@/lib/calender";

function toWeekAvailability(
	availability?: Availability | null,
): WeekAvailability {
	const fallback = defaultWeek();
	if (!availability) return fallback;
	const result = { ...fallback };
	for (const day of dayKeys) {
		const dayVal = availability[day];
		if (dayVal) {
			result[day] = {
				enabled: dayVal.enabled,
				ranges: (dayVal.ranges ?? []).map((r, i) => ({
					id: `${day}-${i}`,
					start: r.start,
					end: r.end,
				})),
			};
		}
	}
	return result;
}

function toServerAvailability(week: WeekAvailability): Availability {
	return Object.fromEntries(
		Object.entries(week).map(([day, val]) => [
			day,
			{
				enabled: val.enabled,
				ranges: val.ranges.map(({ start, end }) => ({ start, end })),
			},
		]),
	) as Availability;
}

function toLeaveDates(
	leaves?: Array<{ start: string | Date }> | null,
): Date[] {
	if (!leaves || !Array.isArray(leaves)) return [];
	return leaves.map((l) => new Date(l.start));
}

export function TeacherAvailabilityCard() {
	const { data: userData } = getUserData();
	const [data, setData] = useState<WeekAvailability>(() =>
		toWeekAvailability(userData?.teacherData?.availability),
	);

	useEffect(() => {
		if (userData?.teacherData?.availability) {
			setData(toWeekAvailability(userData.teacherData.availability));
		}
	}, [userData?.teacherData?.availability]);

	const { mutate: updateAvailability, isPending } = useMutation(
		api.teacher.updateAvailability.mutationOptions({
			onSuccess: () => {
				toast.success({
					title: "Availability updated successfully",
				});
			},
			onError: (error) => {
				toast.error({
					title: error.message || "Failed to update availability",
				});
			},
		}),
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Set Your Weekly Availability</CardTitle>
			</CardHeader>
			<CardContent className="px-0">
				<AvailabilityScheduler value={data} onChange={setData} />
			</CardContent>
			<CardFooter className="justify-between">
				<Field orientation="horizontal" data-disabled className="w-fit">
					<FieldLabel htmlFor="switch">Set to default</FieldLabel>
					<Switch
						id="switch"
						disabled={isPending}
						onCheckedChange={(d) => (d ? setData(defaultWeek()) : {})}
					/>
				</Field>
				<ButtonGroup>
					<Button
						variant="secondary"
						disabled={isPending}
						onClick={() =>
							setData(toWeekAvailability(userData?.teacherData?.availability))
						}
					>
						Reset
					</Button>
					<Button
						disabled={isPending || !data}
						onClick={() => {
							if (data) {
								updateAvailability(toServerAvailability(data));
							}
						}}
					>
						{isPending && <Spinner />}
						Save Availability
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}

export function TeacherLeavesCard() {
	const { data: userData } = getUserData();
	const [date, setDate] = useState<Date[]>(() =>
		toLeaveDates(userData?.teacherData?.leaves),
	);

	useEffect(() => {
		if (userData?.teacherData?.leaves) {
			setDate(toLeaveDates(userData.teacherData.leaves));
		}
	}, [userData?.teacherData?.leaves]);

	const { mutate: updateLeaves, isPending } = useMutation(
		api.teacher.updateLeaves.mutationOptions({
			onSuccess: () => {
				toast.success({
					title: "Leave dates updated successfully",
				});
			},
			onError: (error) => {
				toast.error({
					title: error.message || "Failed to update leaves",
				});
			},
		}),
	);

	const toggleDate = (targetDate: Date) => {
		setDate((prev = []) => {
			const exists = prev.some(
				(d) => d.toDateString() === targetDate.toDateString(),
			);
			if (exists) {
				return prev.filter(
					(d) => d.toDateString() !== targetDate.toDateString(),
				);
			}
			return [...prev, targetDate];
		});
	};

	const selectedCount = date?.length ?? 0;

	return (
		<Card className="flex-1">
			<CardHeader>
				<CardTitle>Select Leave Dates</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-row items-start">
				<Frame className="max-w-fit">
					<Calendar
						buttonVariant="default"
						className="w-auto max-w-72"
						required
						mode="multiple"
						disablePreviousDates
						selected={date}
						onSelect={(d) => setDate(d)}
						defaultMonth={new Date()}
						showOutsideDays={false}
					/>
				</Frame>
				<Card className="grow">
					<CardHeader>
						<CardTitle>Selected Leaves</CardTitle>
					</CardHeader>
					<CardContent>
						<Alert>
							<CircleCheckIcon />
							<AlertTitle>
								{selectedCount === 0
									? "No leaves selected"
									: `${selectedCount} leave date${selectedCount > 1 ? "s" : ""} selected`}
							</AlertTitle>
							<AlertDescription>
								{selectedCount === 0
									? "Pick dates from the calendar or choose quick select options below."
									: date?.map((d) => d.toLocaleDateString()).join(", ")}
							</AlertDescription>
							{selectedCount > 0 && (
								<AlertAction>
									<Button
										size="xs"
										variant="destructive"
										disabled={isPending}
										onClick={() => setDate([])}
									>
										Clear
									</Button>
								</AlertAction>
							)}
						</Alert>
					</CardContent>
					<CardFooter className="flex-wrap">
						<ButtonGroup>
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getToday())}
							>
								Today
							</Button>
							<ButtonGroupSeparator />
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getTomorrow())}
							>
								Tomorrow
							</Button>
						</ButtonGroup>
						<ButtonGroup>
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getTomorrow(2))}
							>
								Day after tomorrow
							</Button>
						</ButtonGroup>
						<ButtonGroup>
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getNextDayOfWeek(6))}
							>
								Next Saturday
							</Button>
							<ButtonGroupSeparator />
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getNextDayOfWeek(0))}
							>
								Next Sunday
							</Button>
						</ButtonGroup>
					</CardFooter>
				</Card>
			</CardContent>
			<CardFooter className="justify-end">
				<ButtonGroup>
					<Button
						variant="secondary"
						disabled={isPending}
						onClick={() => setDate(toLeaveDates(userData?.teacherData?.leaves))}
					>
						Reset
					</Button>
					<Button
						disabled={isPending}
						onClick={() => {
							const payload = (date ?? []).map((d) => ({
								type: "full" as const,
								start: d,
							}));
							updateLeaves(payload);
						}}
					>
						{isPending && <Spinner />}
						Save Leaves
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}

export default function Page() {
	return (
		<div className="flex flex-col flex-wrap items-start gap-3 md:flex-row">
			<TeacherAvailabilityCard />
			<TeacherLeavesCard />
		</div>
	);
}
