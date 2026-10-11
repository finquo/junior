"use client";

import { useMutation } from "@tanstack/react-query";
import { type Availability, dayKeys } from "backend/config";
import { useState } from "react";
import { sileo as toast } from "sileo";
import {
	AvailabilityScheduler,
	defaultWeek,
	type WeekAvailability,
} from "@/components/availability";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { api, refetchAPIs } from "@/hooks/api";

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

export function AvailabilityCard({
	initial,
}: {
	initial?: Availability | null;
}) {
	const reset = () => toWeekAvailability(initial);
	const [data, setData] = useState(reset);

	const { mutateAsync, isPending } = useMutation(
		api.teacher.updateAvailability.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.core.self.teacher.queryKey()]);
				toast.success({
					title: "Availability updated",
				});
			},
			onError: (error) => {
				toast.error({
					title: error.name,
					description: error.message,
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
						onClick={() => setData(reset())}
					>
						Reset
					</Button>
					<Button
						disabled={isPending || !data}
						onClick={() => {
							if (data) {
								mutateAsync(toServerAvailability(data));
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
