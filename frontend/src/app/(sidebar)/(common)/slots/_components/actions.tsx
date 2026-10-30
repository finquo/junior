"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import {
	CalendarClockIcon,
	CheckCheckIcon,
	MoreHorizontalIcon,
	PlayIcon,
	RefreshCwIcon,
	TrashIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerInner,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";
import type { GetFormZod } from "@/lib/utils";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;
type SlotStatus = SlotData["status"];

const periodOptions = [30, 60, 120, 180];

const rescheduleSchema = z.object({
	startTime: z.string().min(1, "Start time is required"),
	period: z.number(),
});

type RescheduleValues = z.infer<typeof rescheduleSchema>;

function toLocalInputValue(date: Date) {
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function RescheduleForm({
	slot,
	onSuccess,
}: {
	slot: SlotData;
	onSuccess: () => void;
}) {
	const initialPeriod = Math.round(
		(new Date(slot.expectedEndTime).getTime() -
			new Date(slot.startTime).getTime()) /
			60_000,
	);

	const { mutateAsync, isPending } = useMutation(
		api.core.slot.reschedule.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.slot.get.queryKey({ input: { id: slot.id } }),
					api.core.slot.list.queryKey(),
				]);
				toast.success({ title: "Session rescheduled successfully" });
				onSuccess();
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			startTime: toLocalInputValue(new Date(slot.startTime)),
			period: periodOptions.includes(initialPeriod) ? initialPeriod : 60,
		} as RescheduleValues,
		validators: {
			onSubmit: rescheduleSchema as GetFormZod<typeof rescheduleSchema>,
		},
		onSubmit: async ({ value }) => {
			const startTime = new Date(value.startTime);
			const expectedEndTime = new Date(
				startTime.getTime() + value.period * 60_000,
			);
			await mutateAsync({
				id: slot.id,
				startTime,
				expectedEndTime,
			});
		},
	});

	return (
		<DrawerInner asChild>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<FieldGroup>
					<form.Field
						name="startTime"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>Start Time</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="datetime-local"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
										disabled={isPending}
									/>
									<FieldDescription>New session start time.</FieldDescription>
								</Field>
							);
						}}
					/>

					<form.Field
						name="period"
						children={(field) => (
							<Field>
								<FieldLabel>Duration (Minutes)</FieldLabel>
								<ButtonGroup>
									{periodOptions.map((option) => (
										<Button
											key={option}
											type="button"
											variant={
												field.state.value === option ? "default" : "outline"
											}
											onClick={() => field.handleChange(option)}
											disabled={isPending}
										>
											{option} mins
										</Button>
									))}
								</ButtonGroup>
								<FieldDescription>
									Select the new session duration.
								</FieldDescription>
							</Field>
						)}
					/>
				</FieldGroup>

				<DrawerFooter>
					<Button type="submit" disabled={isPending}>
						{isPending && <Spinner />}
						Reschedule Session
					</Button>
					<DrawerClose asChild>
						<Button variant="outline" type="button" disabled={isPending}>
							Cancel
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</form>
		</DrawerInner>
	);
}

export function SlotActions({ slot }: { slot: SlotData }) {
	const router = useRouter();
	const [rescheduleOpen, setRescheduleOpen] = useState(false);

	const { mutateAsync: updateStatus, isPending: isUpdating } = useMutation(
		api.core.slot.update.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.slot.get.queryKey({ input: { id: slot.id } }),
					api.core.slot.list.queryKey(),
				]);
				toast.success({ title: "Session status updated" });
			},
		}),
	);

	const { mutateAsync: deleteSlot, isPending: isDeleting } = useMutation(
		api.core.slot.delete.mutationOptions({
			onSuccess: () => {
				refetchAPIs([api.core.slot.list.queryKey()]);
				toast.success({ title: "Session deleted" });
				router.push("/slots");
			},
		}),
	);

	const setStatus = (status: SlotStatus) =>
		updateStatus({ id: slot.id, status });

	const isBusy = isUpdating || isDeleting;

	return (
		<RenderWhenRole role={["admin", "scheduler"]}>
			<AlertDialog>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon-sm" disabled={isBusy}>
							{isBusy ? <Spinner /> : <MoreHorizontalIcon />}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Session Status</DropdownMenuLabel>
						<DropdownMenuItem
							disabled={slot.status === "started" || slot.status === "attended"}
							onClick={() => setStatus("started")}
						>
							<PlayIcon />
							Mark as Started
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={slot.status === "attended"}
							onClick={() => setStatus("attended")}
						>
							<CheckCheckIcon />
							Mark as Attended
						</DropdownMenuItem>
						<DropdownMenuItem
							disabled={slot.status === "request_reschedule"}
							onClick={() => setStatus("request_reschedule")}
						>
							<RefreshCwIcon />
							Request Reschedule
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
							<CalendarClockIcon />
							Reschedule
						</DropdownMenuItem>
						<AlertDialogTrigger asChild>
							<DropdownMenuItem variant="destructive">
								<TrashIcon />
								Delete Session
							</DropdownMenuItem>
						</AlertDialogTrigger>
					</DropdownMenuContent>
				</DropdownMenu>

				<Drawer open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Reschedule Session</DrawerTitle>
							<DrawerDescription>
								Pick a new start time and duration for this session.
							</DrawerDescription>
						</DrawerHeader>
						<RescheduleForm
							slot={slot}
							onSuccess={() => setRescheduleOpen(false)}
						/>
					</DrawerContent>
				</Drawer>

				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<TrashIcon />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete this session?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently remove the session and cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							disabled={isDeleting}
							onClick={() => deleteSlot({ id: slot.id })}
						>
							<TrashIcon />
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</RenderWhenRole>
	);
}
