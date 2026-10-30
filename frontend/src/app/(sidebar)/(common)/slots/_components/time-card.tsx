"use client";

import { type Availability, getDaykey } from "backend/config";
import { ClockIcon } from "lucide-react";
import { parseAsInteger, parseAsIsoDate, useQueryState } from "nuqs";
import { useState } from "react";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimePeriodGroups } from "@/hooks/period";
import type { API_Returns } from "@/lib/api";

export function TimeCard({
	availability,
	unavailable,
}: {
	availability?: Availability | null;
	unavailable?: API_Returns["core"]["slot"]["check"]["unavailable"];
}) {
	const [duration] = useQueryState("duration", parseAsInteger.withDefault(25));
	const [date] = useQueryState("date", parseAsIsoDate);
	const [selectedTime, setSelectedTime] = useQueryState("time", {
		defaultValue: "10:00",
	});

	const upperLimit = "17:00";
	const lowerLimit = "09:00";

	const [hour, setHour] = useState(true);
	const TIME_PERIOD_GROUPS = useTimePeriodGroups(lowerLimit, upperLimit, hour);

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
			(block) =>
				start < timeToMinutes(block.end) && end > timeToMinutes(block.start),
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
				<Tabs defaultValue={TIME_PERIOD_GROUPS[0].key}>
					<TabsList className="w-auto">
						{TIME_PERIOD_GROUPS.map((group) => (
							<TabsTrigger
								key={group.key}
								value={group.key}
								className="capitalize"
							>
								{group.label} {group.key}
							</TabsTrigger>
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
								lowerLimit={lowerLimit}
								upperLimit={upperLimit}
								fixedLength={duration}
								value={selectedTime}
								disabled={isDayDisabled}
								blockedTimes={blockedTimes}
								onChange={(v) => setSelectedTime(v)}
							/>
							<DialogFooter>
								<Field orientation="horizontal" data-disabled className="w-fit">
									<FieldLabel htmlFor="switch">Hourly Based</FieldLabel>
									<Switch
										id="switch"
										checked={hour}
										onCheckedChange={setHour}
									/>
								</Field>
							</DialogFooter>
						</DialogContent>
					</Dialog>
					<Button variant="outline" size="sm" disabled>
						<ClockIcon />
						{selectedTime}
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
