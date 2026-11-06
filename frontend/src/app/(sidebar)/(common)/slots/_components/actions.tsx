"use client";

import { useMutation } from "@tanstack/react-query";
import {
	BellIcon,
	CalendarClockIcon,
	CheckCheckIcon,
	MoreHorizontalIcon,
	PlayIcon,
	RefreshCwIcon,
	TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sileo as toast } from "sileo";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import { RenderWhenRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";

type SlotData = NonNullable<API_Returns["core"]["slot"]["get"]>;
type SlotStatus = SlotData["status"];

export function RequestRescheduleButton({ slot }: { slot: SlotData }) {
	const { mutate, isPending } = useMutation(
		api.core.slot.requestReschedule.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.slot.get.queryKey({ input: { id: slot.id } }),
					api.core.slot.list.queryKey(),
				]);
				toast.success({ title: "Reschedule requested" });
			},
		}),
	);

	return (
		<Button
			variant="outline"
			size="sm"
			disabled={isPending || slot.status === "request_reschedule"}
			onClick={() => mutate({ id: slot.id })}
		>
			{isPending ? <Spinner /> : <RefreshCwIcon />}
			Request Reschedule
		</Button>
	);
}

export function SlotActions({ slot }: { slot: SlotData }) {
	const router = useRouter();

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
					<DropdownMenuContent className="min-w-48" align="end">
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
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link
								href={
									`/slots/${slot.id}/edit?studentId=${slot.studentId ?? ""}&lessonId=${slot.lessonId ?? ""}` as "/"
								}
							>
								<CalendarClockIcon />
								Reschedule
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuLabel>Alert Participants</DropdownMenuLabel>
						<MutationButton
							api={api.chat.alertStudent.mutationOptions()}
							onSuccess={(sent) => {
								if (sent) {
									toast.success({ title: "Student alerted" });
								} else {
									toast.error({ title: "Failed to alert student" });
								}
							}}
							isPending={
								<DropdownMenuItem disabled>
									<Spinner />
									Alerting Student...
								</DropdownMenuItem>
							}
							mutate={(mutate) => (
								<DropdownMenuItem onSelect={() => mutate({ id: slot.id })}>
									<BellIcon />
									Alert Student
								</DropdownMenuItem>
							)}
						/>
						<MutationButton
							api={api.chat.alertTeacher.mutationOptions()}
							onSuccess={(sent) => {
								if (sent) {
									toast.success({ title: "Teacher alerted" });
								} else {
									toast.error({ title: "Failed to alert teacher" });
								}
							}}
							isPending={
								<DropdownMenuItem disabled>
									<Spinner />
									Alerting Teacher...
								</DropdownMenuItem>
							}
							mutate={(mutate) => (
								<DropdownMenuItem onSelect={() => mutate({ id: slot.id })}>
									<BellIcon />
									Alert Teacher
								</DropdownMenuItem>
							)}
						/>
						<MutationButton
							api={api.chat.alertScheduler.mutationOptions()}
							onSuccess={(sent) => {
								if (sent) {
									toast.success({ title: "Scheduler alerted" });
								} else {
									toast.error({ title: "Failed to alert scheduler" });
								}
							}}
							isPending={
								<DropdownMenuItem disabled>
									<Spinner />
									Alerting Scheduler...
								</DropdownMenuItem>
							}
							mutate={(mutate) => (
								<DropdownMenuItem onSelect={() => mutate({ id: slot.id })}>
									<BellIcon />
									Alert Scheduler
								</DropdownMenuItem>
							)}
						/>
						<AlertDialogTrigger asChild>
							<DropdownMenuItem variant="destructive">
								<TrashIcon />
								Delete Session
							</DropdownMenuItem>
						</AlertDialogTrigger>
					</DropdownMenuContent>
				</DropdownMenu>

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
