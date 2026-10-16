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
import { getNextDayOfWeek, getToday, getTomorrow } from "@/lib/calender";

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
