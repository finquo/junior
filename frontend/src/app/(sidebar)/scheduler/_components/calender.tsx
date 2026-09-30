"use client";

import { parseAsIsoDate, useQueryState } from "nuqs";
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

function getToday() {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

function getTomorrow() {
	const d = new Date();
	d.setDate(d.getDate() + 1);
	d.setHours(0, 0, 0, 0);
	return d;
}

function getNextDayOfWeek(targetDay: number) {
	const d = new Date();
	const currentDay = d.getDay();
	const diff = (targetDay - currentDay + 7) % 7;
	d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
	d.setHours(0, 0, 0, 0);
	return d;
}

export function CalenderPicker() {
	const [date, setDate] = useQueryState("date", parseAsIsoDate);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Select a Date</CardTitle>
			</CardHeader>
			<CardContent>
				<Calendar
					buttonVariant={"default"}
					className="w-auto"
					required
					mode="single"
					disablePreviousDates
					selected={date ?? undefined}
					onSelect={(d) => setDate(d ?? null)}
					defaultMonth={date ?? undefined}
					showOutsideDays={false}
				/>
			</CardContent>
			<CardFooter className="flex-wrap">
				<ButtonGroup>
					<Button variant={"secondary"} onClick={() => setDate(getToday())}>
						Today
					</Button>
					<ButtonGroupSeparator />
					<Button variant={"secondary"} onClick={() => setDate(getTomorrow())}>
						Tomorrow
					</Button>
				</ButtonGroup>
				<ButtonGroup>
					<Button
						variant={"secondary"}
						onClick={() => setDate(getNextDayOfWeek(6))}
					>
						Next Saturday
					</Button>
					<ButtonGroupSeparator />
					<Button
						variant={"secondary"}
						onClick={() => setDate(getNextDayOfWeek(0))}
					>
						Next Sunday
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
