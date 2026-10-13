"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { mergeDateWithTimeString } from "utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerInner,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
	TabsContent,
	TabsList,
	TabsPanel,
	TabsRoot,
	TabsTrigger,
} from "@/components/ui/tabs";
import { api, refetchAPIs } from "@/hooks/api";

export function AddLeaveDrawer({ children }: TriggerType) {
	const [open, setOpen] = useState(false);

	const [startDate, setStartDate] = useState<Date>();
	const [endDate, setEndDate] = useState<Date>();

	const [startTime, setStartTime] = useState<string>();
	const [endTime, setEndTime] = useState<string>();

	const { mutateAsync, isPending } = useMutation(
		api.teacher.addLeave.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.core.self.teacher.queryKey()]);
				setOpen(false);
				toast.success({
					title: "Leave added successfully",
				});
			},
			onError: (error) => {
				toast.error({
					title: error.message || "Failed to add leave",
				});
			},
		}),
	);

	const handleFullConfirm = () => {
		if (!startDate) return;
		mutateAsync({
			type: "full",
			start: startDate,
		});
	};

	const handleMultipleConfirm = () => {
		if (!startDate || !endDate) return;
		mutateAsync({
			type: "multiple",
			start: startDate,
			end: endDate,
		});
	};

	const handlePartialConfirm = () => {
		if (!startDate || !startTime || !endTime) return;

		const start = mergeDateWithTimeString(startDate, startTime);
		const end = mergeDateWithTimeString(startDate, endTime);

		if (end.getTime() <= start.getTime()) {
			toast.error({
				title: "End time must be after start time",
			});
			return;
		}

		mutateAsync({
			type: "partial",
			start,
			end,
		});
	};

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger render={children} />
			<DrawerContent render={<TabsRoot defaultValue="full" />}>
				<DrawerHeader>
					<DrawerTitle>Add Leave</DrawerTitle>
					<DrawerDescription>
						Choose leave duration and select dates.
					</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<TabsList className="w-full">
						<TabsTrigger value="full">Full Day</TabsTrigger>
						<TabsTrigger value="multiple">Multiple Days</TabsTrigger>
						<TabsTrigger value="partial">Partial Day</TabsTrigger>
					</TabsList>

					<TabsContent value="full">
						<Calendar
							className="w-full rounded-xl"
							buttonVariant="default"
							mode="single"
							disablePreviousDates
							selected={startDate}
							onSelect={setStartDate}
							defaultMonth={new Date()}
							showOutsideDays={false}
						/>
					</TabsContent>

					<TabsContent value="multiple">
						<Calendar
							className="w-full rounded-xl"
							buttonVariant="default"
							mode="range"
							numberOfMonths={1}
							disablePreviousDates
							selected={
								startDate ? { from: startDate, to: endDate } : undefined
							}
							onSelect={(range) => {
								setStartDate(range?.from);
								setEndDate(range?.to);
							}}
							defaultMonth={new Date()}
							showOutsideDays={false}
						/>
					</TabsContent>

					<TabsContent value="partial">
						<Calendar
							className="w-full rounded-xl"
							buttonVariant="default"
							mode="single"
							disablePreviousDates
							selected={startDate}
							onSelect={setStartDate}
							defaultMonth={new Date()}
							showOutsideDays={false}
						/>
						<Field>
							<FieldLabel>Start Time</FieldLabel>
							<Input
								type="time"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel>End Time</FieldLabel>
							<Input
								type="time"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
							/>
						</Field>
					</TabsContent>
				</DrawerInner>

				<DrawerFooter>
					<TabsPanel
						value="full"
						render={
							<Button
								disabled={!startDate || isPending}
								onClick={handleFullConfirm}
							/>
						}
					>
						{isPending && <Spinner />}
						Confirm Full Day Leave
					</TabsPanel>
					<TabsPanel
						value="multiple"
						render={
							<Button
								disabled={!startDate || !endDate || isPending}
								onClick={handleMultipleConfirm}
							/>
						}
					>
						{isPending && <Spinner />}
						Confirm Multiple Days Leave
					</TabsPanel>
					<TabsPanel
						value="partial"
						render={
							<Button
								disabled={!startDate || !startTime || !endTime || isPending}
								onClick={handlePartialConfirm}
							/>
						}
					>
						{isPending && <Spinner />}
						Confirm Partial Leave
					</TabsPanel>
					<DrawerClose render={<Button variant="outline" />}>Close</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
