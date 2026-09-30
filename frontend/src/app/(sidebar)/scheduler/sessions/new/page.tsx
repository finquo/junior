"use client";

import { CircleCheckIcon } from "lucide-react";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { useState } from "react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/hooks/api";
import { DURATIONS, useTimePeriodGroups } from "@/hooks/period";
import { CalenderPicker } from "../../_components/calender";
import { UserSelector } from "../../_components/selecter";

export default function Pattern() {
	const [studentId, setStudentId] = useQueryState("studentId");
	const [teacherId, setTeacherId] = useQueryState("teacherId");
	const [lessonId, setLessonId] = useQueryState("lessonId");

	const [date] = useQueryState("date", parseAsIsoDate);
	const [selectedTime, setSelectedTime] = useQueryState("time", {
		defaultValue: "10:00",
	});

	const [hour, setHour] = useState(true);
	const TIME_PERIOD_GROUPS = useTimePeriodGroups("9-5", hour);

	return (
		<div className="flex flex-col flex-wrap gap-3 md:h-svh md:flex-row md:items-start">
			<div className="flex-1 space-y-3">
				<Card>
					<CardHeader>
						<CardTitle>Select Users</CardTitle>
					</CardHeader>
					<CardContent>
						<UserSelector
							name="student"
							label="Student"
							api={api.scheduler.getStudents.queryOptions()}
						/>
						<UserSelector
							name="teacher"
							label="Teacher"
							api={api.scheduler.getTeachers.queryOptions()}
						/>
					</CardContent>
					<CardFooter>
						<ButtonGroup>
							<ButtonGroupText>Durations</ButtonGroupText>
							{DURATIONS.map((d) => (
								<Button key={d}>{d}</Button>
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
