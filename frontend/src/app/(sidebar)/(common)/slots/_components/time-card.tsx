"use client";

import { type Availability, getDaykey } from "backend/config";
import { ClockIcon } from "lucide-react";
import { parseAsInteger, parseAsIsoDate, useQueryState } from "nuqs";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { mergeDateWithTimeString } from "utils";
import DaySlider from "@/components/day-slider";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import { useTimePeriodGroups } from "@/hooks/period";
import type { API_Returns } from "@/lib/api";

export function TimeCard({
	availability,
	unavailable,
}: {
	availability?: Availability | null;
	unavailable?: API_Returns["core"]["slot"]["check"]["unavailable"];
}) {
	const [teacherId] = useQueryState("teacherId");
	const [duration] = useQueryState("duration", parseAsInteger.withDefault(25));
	const [date] = useQueryState("date", parseAsIsoDate);
	const [selectedTime, setSelectedTime] = useQueryState("time", {
		defaultValue: "10:00",
	});

	const upperLimit = "17:00";
	const lowerLimit = "09:00";

	const [hour, setHour] = useState(true);
	const TIME_PERIOD_GROUPS = useTimePeriodGroups(lowerLimit, upperLimit, hour);

	const isCheckDisabled = Boolean(!teacherId || !date);

	const dateWithTime = date
		? selectedTime
			? mergeDateWithTimeString(date, selectedTime)
			: date
		: new Date();

	const timeToMinutes = (time: string) => {
		const [hours = 0, minutes = 0] = time.split(":").map(Number);
		return hours * 60 + minutes;
	};

	const minutesToTime = (minutes: number) => {
		const clamped = Math.max(0, Math.min(24 * 60, minutes));
		return `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(
			clamped % 60,
		).padStart(2, "0")}`;
	};

	const dayAvailability =
		date && availability ? availability[getDaykey(date.getDay())] : undefined;

	const isDayDisabled = Boolean(
		dayAvailability &&
			(!dayAvailability.enabled || (dayAvailability.ranges ?? []).length === 0),
	);

	const blockedTimes = (() => {
		// Once a date is selected the backend returns the combined unavailable
		// intervals (outside availability + leaves + booked conflicts).
		if (unavailable && unavailable.length > 0) {
			return unavailable.map((item) => ({
				id: item.id,
				start: item.start,
				end: item.end,
				label: item.label,
			}));
		}

		// Fall back to the teacher's weekly availability for the selected day.
		if (!dayAvailability) return [];

		const ranges = [...(dayAvailability.ranges ?? [])]
			.map((range) => ({
				start: timeToMinutes(range.start),
				end: timeToMinutes(range.end),
			}))
			.sort((a, b) => a.start - b.start);

		if (!dayAvailability.enabled || ranges.length === 0) {
			return [
				{
					id: "day-disabled",
					start: "00:00",
					end: "24:00",
					label: "Teacher unavailable",
				},
			];
		}

		const gaps: { start: number; end: number }[] = [];
		let cursor = 0;
		for (const range of ranges) {
			if (range.start > cursor) gaps.push({ start: cursor, end: range.start });
			cursor = Math.max(cursor, range.end);
		}
		if (cursor < 24 * 60) gaps.push({ start: cursor, end: 24 * 60 });

		return gaps.map((gap, index) => ({
			id: `gap-${index}`,
			start: minutesToTime(gap.start),
			end: minutesToTime(gap.end),
			label: "Outside teacher availability",
		}));
	})();

	const isTimeBlocked = (time: string) => {
		const start = timeToMinutes(time);
		const end = start + duration;
		return blockedTimes.some(
			(block) => start < timeToMinutes(block.end) && end > timeToMinutes(block.start),
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Select Time</CardTitle>
				<CardAction>
					<Field orientation="horizontal" data-disabled className="w-fit">
						<FieldLabel htmlFor="switch">Hourly Based</FieldLabel>
						<Switch id="switch" checked={hour} onCheckedChange={setHour} />
					</Field>
				</CardAction>
			</CardHeader>
			<CardContent>
				<Tabs>
					<TabsList className="w-auto">
						{TIME_PERIOD_GROUPS.map((group) => (
							<Tooltip key={group.key}>
								<TooltipTrigger asChild>
									<TabsTrigger value={group.key}>{group.label}</TabsTrigger>
								</TooltipTrigger>
								<TooltipContent className="capitalize">
									{group.key}
								</TooltipContent>
							</Tooltip>
						))}
					</TabsList>
					{TIME_PERIOD_GROUPS.map((group) => (
						<TabsContent key={group.key} value={group.key}>
							<div className="grid grid-cols-4 gap-2">
								{group.times.map((time) => {
									const isSelected = selectedTime === time;
									const isBlocked = isTimeBlocked(time);
									const variant = isSelected ? "default" : "outline";
									return (
										<Button
											key={time}
											disabled={isBlocked}
											onClick={() => setSelectedTime(time)}
											variant={variant}
										>
											{time}
										</Button>
									);
								})}
							</div>
						</TabsContent>
					))}
				</Tabs>
			</CardContent>
			<CardFooter>
				<ButtonGroup>
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline" size="sm">
								Pick Presize Time
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Pick a precise time</DialogTitle>
								<DialogDescription>
									Drag to choose a start time for the selected duration.
								</DialogDescription>
							</DialogHeader>
							<DaySlider
								step={hour ? 60 : 15}
								className="w-6xl"
								lowerLimit={lowerLimit}
								upperLimit={upperLimit}
								fixedLength={duration}
								value={selectedTime}
								disabled={isDayDisabled}
								blockedTimes={blockedTimes}
								onChange={(v) => setSelectedTime(v)}
							/>
						</DialogContent>
					</Dialog>
					<Button variant="outline" size="sm" disabled>
						<ClockIcon />
						{selectedTime}
					</Button>
				</ButtonGroup>
				<ButtonGroup>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="secondary" size="sm" disabled={isCheckDisabled}>
								Check Availability
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start">
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
										Checking teacher availability…
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
										Check teacher availability
									</DropdownMenuItem>
								)}
							/>
						</DropdownMenuContent>
					</DropdownMenu>
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
							<Button variant="secondary" size="sm" disabled>
								<Spinner />
								Check Slot Availability
							</Button>
						}
						mutate={(mutate) => (
							<Button
								variant="secondary"
								size="sm"
								disabled={isCheckDisabled}
								onClick={() => {
									if (!teacherId || !date) return;
									mutate({
										teacherId,
										date: dateWithTime,
										period: duration,
									});
								}}
							>
								Check Slot Availability
							</Button>
						)}
					/>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
