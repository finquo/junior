"use client";

import { parseAsInteger, parseAsIsoDate, useQueryState } from "nuqs";
import { sileo as toast } from "sileo";
import { mergeDateWithTimeString } from "utils";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import { CheckedAlert } from "./alert";

export function PreviewCard() {
	const [studentId] = useQueryState("studentId");
	const [teacherId] = useQueryState("teacherId");
	const [schedulerId] = useQueryState("schedulerId");
	const [lessonId] = useQueryState("lessonId");
	const [duration] = useQueryState("duration", parseAsInteger.withDefault(25));
	const [date] = useQueryState("date", parseAsIsoDate);
	const [selectedTime] = useQueryState("time", {
		defaultValue: "10:00",
	});

	const isConfirmDisabled = Boolean(
		!studentId ||
			!teacherId ||
			!schedulerId ||
			!lessonId ||
			!date ||
			!selectedTime,
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Preview Schedule</CardTitle>
				<CardDescription>
					Update to see changes in your meeting.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<CheckedAlert />
			</CardContent>
			<CardFooter>
				<MutationButton
					api={api.core.slot.create.mutationOptions()}
					onSuccess={() => {
						refetchAPIs([api.core.slot.list.queryKey()]);
						toast.success({
							title: "Slot created successfully!",
						});
					}}
					isPending={
						<Button
							disabled
							className="w-full md:ml-auto md:w-auto"
							variant="outline"
						>
							<Spinner />
							Confirm
						</Button>
					}
					mutate={(mutate) => (
						<Button
							disabled={isConfirmDisabled}
							className="w-full md:ml-auto md:w-auto"
							variant="outline"
							onClick={() => {
								if (
									!studentId ||
									!teacherId ||
									!schedulerId ||
									!lessonId ||
									!date ||
									!selectedTime
								) {
									return;
								}

								const startTime = mergeDateWithTimeString(date, selectedTime);

								mutate({
									studentId,
									teacherId,
									schedulerId,
									lessonId,
									startTime,
									period: duration,
								});
							}}
						>
							Confirm
						</Button>
					)}
				/>
			</CardFooter>
		</Card>
	);
}
