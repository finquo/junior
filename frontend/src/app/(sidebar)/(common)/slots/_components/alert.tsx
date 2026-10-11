"use client";

import { CircleCheckIcon } from "lucide-react";
import { parseAsIsoDate, useQueryState } from "nuqs";
import {
	Alert,
	AlertAction,
	AlertDescription,
	AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function CheckedAlert() {
	const [date, setDate] = useQueryState("date", parseAsIsoDate);
	const [selectedTime, setSelectedTime] = useQueryState("time", {
		defaultValue: "10:00",
	});

	const formattedDate = date?.toLocaleDateString("en-US", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	const handleClear = () => {
		setDate(null);
		setSelectedTime("10:00");
	};

	return (
		<Alert>
			<CircleCheckIcon />
			<AlertTitle>Checked</AlertTitle>
			<AlertDescription>
				Your meeting is booked for &nbsp;
				<span className="font-medium">{formattedDate}</span>
				&nbsp; at <span className="font-medium">{selectedTime}</span>
			</AlertDescription>
			<AlertAction>
				<Button size="xs" variant="destructive" onClick={handleClear}>
					Clear
				</Button>
			</AlertAction>
		</Alert>
	);
}
