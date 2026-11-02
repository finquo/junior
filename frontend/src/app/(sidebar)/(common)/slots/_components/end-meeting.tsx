"use client";

import { useMutation } from "@tanstack/react-query";
import { PhoneOffIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";

export function EndMeeting({ slotId }: { slotId: string }) {
	const { mutate, isPending } = useMutation(
		api.core.slot.end.mutationOptions({
			onSuccess: () => {
				toast.success({ title: "Meeting ended" });
				refetchAPIs([api.core.slot.get.queryKey({ input: { id: slotId } })]);
			},
			onError: (error) => {
				toast.error({
					title: "Could not end meeting",
					description: error.message,
				});
			},
		}),
	);

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" size="sm">
					<PhoneOffIcon />
					End meeting
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>End meeting for all?</AlertDialogTitle>
					<AlertDialogDescription>
						Everyone will be disconnected immediately. This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={isPending}
						onClick={() => mutate({ id: slotId })}
					>
						{isPending && <Spinner />}
						End meeting
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
