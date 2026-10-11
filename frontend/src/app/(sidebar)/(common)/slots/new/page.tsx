"use client";

import { useMutation } from "@tanstack/react-query";
import { period } from "backend/config";
import { CircleCheckIcon } from "lucide-react";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { mergeDateWithTimeString } from "utils";
import DaySlider from "@/components/day-slider";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
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
import { useTimePeriodGroups } from "@/hooks/period";
import { RenderWhenRole } from "@/hooks/role";
import { CalenderPicker } from "../_components/calender";
import { UserSelector } from "../_components/selecter";

export default function Pattern() {
	const [schedulerId, setSchedulerId] = useQueryState("schedulerId");
	const [studentId, setStudentId] = useQueryState("studentId");
	const [teacherId, setTeacherId] = useQueryState("teacherId");
	const [lessonId, setLessonId] = useQueryState("lessonId");
	const [duration, setDuration] = useState<number>(25);

	const [date] = useQueryState("date", parseAsIsoDate);
	const [selectedTime, setSelectedTime] = useQueryState("time", {
		defaultValue: "10:00",
	});

	const upperLimit = "17:00";
	const lowerLimit = "09:00";

	const [hour, setHour] = useState(true);
	const TIME_PERIOD_GROUPS = useTimePeriodGroups(lowerLimit, upperLimit, hour);

	const { mutate: checkAvailability, isPending: isChecking } = useMutation(
		api.core.teacher.checkAvailability.mutationOptions({
			onSuccess: (result) => {
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
							result.reason || "Teacher is not available for this period.",
					});
				}
			},
			onError: (error) => {
				toast.error({
					title: error.message || "Failed to check availability",
				});
			},
		}),
	);

	const handleCheckAvailability = () => {
		if (!teacherId) {
			toast.error({ title: "Please select a teacher first" });
			return;
		}
		if (!date) {
			toast.error({ title: "Please select a date first" });
			return;
		}

		const dateWithTime = selectedTime
			? mergeDateWithTimeString(date, selectedTime)
			: date;

		console.log(dateWithTime);

		checkAvailability({
			id: teacherId,
			date: dateWithTime,
			period: duration,
		});
	};

	return (
		<div className="flex flex-col flex-wrap gap-3 md:h-svh md:flex-row md:items-start">
			<div className="flex-1 space-y-3">
				<Card>
					<CardHeader>
						<CardTitle>Select Users</CardTitle>
					</CardHeader>
					<CardContent>
						<UserSelector
							name="studentId"
							label="Student"
							api={api.core.student.list.queryOptions()}
						/>
						<UserSelector
							name="teacherId"
							label="Teacher"
							api={api.core.teacher.list.queryOptions()}
						/>
						<RenderWhenRole role={["admin"]}>
							<UserSelector
								name="schedulerId"
								label="Scheduler"
								api={api.core.scheduler.list.queryOptions()}
							/>
						</RenderWhenRole>
					</CardContent>
					<CardFooter>
						<ButtonGroup>
							<ButtonGroupText>Durations</ButtonGroupText>
							{period.map((value) => (
								<Button onClick={() => setDuration(value)} key={value}>
									{value}
								</Button>
							))}
						</ButtonGroup>
					</CardFooter>
				</Card>
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
												<TabsTrigger value={group.key}>
													{group.label}
												</TabsTrigger>
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
											return (
												<Button
													key={time}
													onClick={() => setSelectedTime(time)}
													variant={
														selectedTime === time ? "default" : "outline"
													}
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
						<Button
							disabled={isChecking || !teacherId || !date}
							onClick={handleCheckAvailability}
						>
							{isChecking && <Spinner />}
							Check Availability
						</Button>
					</CardFooter>
				</Card>
			</div>

			<CalenderPicker />

			<div className="flex-1 space-y-3">
				<Card>
					<CardHeader>
						<CardTitle>Preview Schedule</CardTitle>
						<CardDescription>
							Update to see changes in your meeting.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Alert>
							<CircleCheckIcon />
							<AlertTitle>Checked</AlertTitle>
							<AlertDescription>
								Your meeting is booked for &nbsp;
								<span className="font-medium">
									{date?.toLocaleDateString("en-US", {
										weekday: "long",
										day: "numeric",
										month: "long",
									})}
								</span>
								&nbsp; at <span className="font-medium">{selectedTime}</span>
							</AlertDescription>
							<AlertAction>
								<Button size={"xs"} variant="destructive">
									Clear
								</Button>
							</AlertAction>
						</Alert>
					</CardContent>
					<CardFooter>
						<Button
							disabled={!date || !selectedTime}
							className="w-full md:ml-auto md:w-auto"
							variant="outline"
						>
							Confirm
						</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
