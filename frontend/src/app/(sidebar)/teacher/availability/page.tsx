"use client";

import { CircleCheckIcon } from "lucide-react";
import { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { getNextDayOfWeek, getToday, getTomorrow } from "@/lib/calender";

export default function Page() {
	const [date, setDate] = useState<Date[]>();
	const [data, setData] = useState<WeekAvailability>();

	return (
		<div className="flex flex-col flex-wrap items-start gap-3 md:flex-row">
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
							onCheckedChange={(d) => (d ? setData(defaultWeek()) : {})}
						/>
					</Field>
					<ButtonGroup>
						<Button variant={"secondary"}>Reset</Button>
						<Button>Save Availability</Button>
					</ButtonGroup>
				</CardFooter>
			</Card>
			<Card className="flex-1">
				<CardHeader>
					<CardTitle>Select Leave Dates</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-row items-start">
					<Frame className="max-w-fit">
						<Calendar
							buttonVariant={"default"}
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
							<CardTitle>Select Leave Dates</CardTitle>
						</CardHeader>
						<CardContent>
							<Alert>
								<CircleCheckIcon />
								<AlertTitle>Checked</AlertTitle>
								<AlertDescription>
									Your meeting is booked for &nbsp; &nbsp; at{" "}
									<span className="font-medium" />
								</AlertDescription>
								<AlertAction>
									<Button size={"xs"} variant="destructive">
										Clear
									</Button>
								</AlertAction>
							</Alert>
						</CardContent>
						<CardFooter className="flex-wrap">
							<ButtonGroup>
								<Button
									variant={"secondary"}
									onClick={() => setDate((e) => [...(e ?? []), getToday()])}
								>
									Today
								</Button>
								<ButtonGroupSeparator />
								<Button
									variant={"secondary"}
									onClick={() => setDate((e) => [...(e ?? []), getTomorrow()])}
								>
									Tomorrow
								</Button>
							</ButtonGroup>
							<ButtonGroup>
								<Button
									variant={"secondary"}
									onClick={() => setDate((e) => [...(e ?? []), getTomorrow(2)])}
								>
									Day after tomorrow
								</Button>
							</ButtonGroup>
							<ButtonGroup>
								<Button
									variant={"secondary"}
									onClick={() =>
										setDate((e) => [...(e ?? []), getNextDayOfWeek(6)])
									}
								>
									Next Saturday
								</Button>
								<ButtonGroupSeparator />
								<Button
									variant={"secondary"}
									onClick={() =>
										setDate((e) => [...(e ?? []), getNextDayOfWeek(0)])
									}
								>
									Next Sunday
								</Button>
							</ButtonGroup>
						</CardFooter>
					</Card>
				</CardContent>
				<CardFooter className="justify-end">
					<ButtonGroup>
						<Button variant={"secondary"}>Reset</Button>
						<Button>Save Leaves</Button>
					</ButtonGroup>
				</CardFooter>
			</Card>
		</div>
	);
}
