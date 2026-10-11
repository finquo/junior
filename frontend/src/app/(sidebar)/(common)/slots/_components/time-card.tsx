"use client";

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

export function TimeCard() {
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
								<TooltipTrigger
									render={
										<TabsTrigger value={group.key}>{group.label}</TabsTrigger>
									}
								/>
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
									const variant = isSelected ? "default" : "outline";
									return (
										<Button
											key={time}
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
				<Dialog>
					<DialogTrigger render={<Button variant="outline" size="sm" />}>
						Pick Presize Time
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Are you absolutely sure?</DialogTitle>
							<DialogDescription>
								This action cannot be undone.
							</DialogDescription>
						</DialogHeader>
						<DaySlider
							step={hour ? 60 : 15}
							className="w-6xl"
							lowerLimit={lowerLimit}
							upperLimit={upperLimit}
							fixedLength={duration}
							value={selectedTime}
							onChange={(v) => setSelectedTime(v)}
						/>
					</DialogContent>
				</Dialog>
				<ButtonGroup>
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
							<Button variant="secondary" disabled>
								<Spinner />
								Check Teacher Availability
							</Button>
						}
						mutate={(mutate) => (
							<Button
								variant="secondary"
								disabled={isCheckDisabled}
								onClick={() => {
									if (!teacherId || !date) return;
									mutate({
										id: teacherId,
										date: dateWithTime,
										period: duration,
									});
								}}
							>
								Check Teacher Availability
							</Button>
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
							<Button disabled>
								<Spinner />
								Check Slot Availability
							</Button>
						}
						mutate={(mutate) => (
							<Button
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
