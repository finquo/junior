"use client";

import { useMutation } from "@tanstack/react-query";
import type { LeaveRangeOutput } from "backend/config";
import { CircleCheckIcon } from "lucide-react";
import { useState } from "react";
import { sileo as toast } from "sileo";
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
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { getNextDayOfWeek, getToday, getTomorrow } from "@/lib/calender";

function toLeaveDates(leaves?: Array<{ start: string | Date }> | null): Date[] {
	if (!leaves || !Array.isArray(leaves)) return [];
	return leaves.map((l) => new Date(l.start));
}

export function LeavesCard({ initial }: { initial?: LeaveRangeOutput | null }) {
	const reset = () => toLeaveDates(initial);
	const [date, setDate] = useState<Date[]>(reset);

	const { mutate: updateLeaves, isPending } = useMutation(
		api.teacher.updateLeaves.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.core.self.teacher.queryKey()]);
				toast.success({
					title: "Leave dates updated successfully",
				});
			},
			onError: (error) => {
				toast.error({
					title: error.message || "Failed to update leaves",
				});
			},
		}),
	);

	const toggleDate = (targetDate: Date) => {
		setDate((prev = []) => {
			const exists = prev.some(
				(d) => d.toDateString() === targetDate.toDateString(),
			);
			if (exists) {
				return prev.filter(
					(d) => d.toDateString() !== targetDate.toDateString(),
				);
			}
			return [...prev, targetDate];
		});
	};

	const selectedCount = date?.length ?? 0;

	return (
		<Card className="flex-1">
			<CardHeader>
				<CardTitle>Select Leave Dates</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-row items-start">
				<Frame className="max-w-fit">
					<Calendar
						buttonVariant="default"
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
						<CardTitle>Selected Leaves</CardTitle>
					</CardHeader>
					<CardContent>
						<Alert>
							<CircleCheckIcon />
							<AlertTitle>
								{selectedCount === 0
									? "No leaves selected"
									: `${selectedCount} leave date${selectedCount > 1 ? "s" : ""} selected`}
							</AlertTitle>
							<AlertDescription>
								{selectedCount === 0
									? "Pick dates from the calendar or choose quick select options below."
									: date?.map((d) => d.toLocaleDateString()).join(", ")}
							</AlertDescription>
							{selectedCount > 0 && (
								<AlertAction>
									<Button
										size="xs"
										variant="destructive"
										disabled={isPending}
										onClick={() => setDate([])}
									>
										Clear
									</Button>
								</AlertAction>
							)}
						</Alert>
					</CardContent>
					<CardFooter className="flex-wrap">
						<ButtonGroup>
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getToday())}
							>
								Today
							</Button>
							<ButtonGroupSeparator />
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getTomorrow())}
							>
								Tomorrow
							</Button>
						</ButtonGroup>
						<ButtonGroup>
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getTomorrow(2))}
							>
								Day after tomorrow
							</Button>
						</ButtonGroup>
						<ButtonGroup>
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getNextDayOfWeek(6))}
							>
								Next Saturday
							</Button>
							<ButtonGroupSeparator />
							<Button
								variant="secondary"
								disabled={isPending}
								onClick={() => toggleDate(getNextDayOfWeek(0))}
							>
								Next Sunday
							</Button>
						</ButtonGroup>
					</CardFooter>
				</Card>
			</CardContent>
			<CardFooter className="justify-end">
				<ButtonGroup>
					<Button
						variant="secondary"
						disabled={isPending}
						onClick={() => setDate(reset())}
					>
						Reset
					</Button>
					<Button
						disabled={isPending}
						onClick={() => {
							const payload = (date ?? []).map((d) => ({
								type: "full" as const,
								start: d,
							}));
							updateLeaves(payload);
						}}
					>
						{isPending && <Spinner />}
						Save Leaves
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
