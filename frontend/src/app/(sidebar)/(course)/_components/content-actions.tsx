"use client";

import { Trash2Icon } from "lucide-react";
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
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";

export function ModuleDeleteButton({
	moduleId,
	courseId,
	name,
	navigateOnSuccess = false,
	onSuccess,
	children,
}: {
	moduleId: string;
	courseId: string;
	name: string;
	navigateOnSuccess?: boolean;
	onSuccess?: () => void;
	children: React.ReactElement;
}) {
	const router = useRouter();

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete "{name}" ?</AlertDialogTitle>
					<AlertDialogDescription>
						This removes the module and its videos. This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<MutationButton
						api={api.core.module.delete.mutationOptions({
							onSuccess: () => {
								refetchAPIs([api.core.module.listAll.queryKey()]);
								refetchAPIs([api.sidebar.modules.queryKey()]);
								if (courseId) {
									refetchAPIs([
										api.core.module.list.queryKey({
											input: { course: courseId },
										}),
									]);
									refetchAPIs([
										api.core.video.list.queryKey({
											input: { course: courseId },
										}),
									]);
									refetchAPIs([
										api.core.course.get.queryKey({ input: { id: courseId } }),
									]);
								}
								toast.success({ title: "Module deleted" });
								onSuccess?.();
								if (navigateOnSuccess) router.push("/modules" as "/");
							},
						})}
						mutate={(mutate) => (
							<AlertDialogAction
								variant="destructive"
								onClick={() => mutate({ id: moduleId })}
							>
								<Trash2Icon />
								Delete
							</AlertDialogAction>
						)}
						isPending={
							<AlertDialogAction variant="destructive">
								Deleting
							</AlertDialogAction>
						}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function VideoDeleteButton({
	videoId,
	courseId,
	moduleId,
	name,
	navigateOnSuccess = true,
	onSuccess,
	children,
}: {
	videoId: string;
	courseId: string;
	moduleId: string;
	name: string;
	navigateOnSuccess?: boolean;
	onSuccess?: () => void;
	children: React.ReactElement;
}) {
	const router = useRouter();

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {name}?</AlertDialogTitle>
					<AlertDialogDescription>
						This removes the video metadata. This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<MutationButton
						api={api.core.video.delete.mutationOptions({
							onSuccess: () => {
								refetchAPIs([
									api.core.video.list.queryKey({
										input: { course: courseId },
									}),
									api.core.video.list.queryKey({
										input: { course: courseId, module: moduleId },
									}),
									api.core.module.get.queryKey({ input: { id: moduleId } }),
									api.core.module.list.queryKey({
										input: { course: courseId },
									}),
									api.core.course.get.queryKey({
										input: { id: courseId },
									}),
								]);
								toast.success({ title: "Video deleted" });
								onSuccess?.();
								if (navigateOnSuccess)
									router.push(`/modules/${moduleId}` as "/");
							},
						})}
						mutate={(mutate) => (
							<AlertDialogAction
								variant="destructive"
								onClick={() => mutate({ id: videoId })}
							>
								<Trash2Icon />
								Delete
							</AlertDialogAction>
						)}
						isPending={
							<AlertDialogAction variant="destructive">
								Deleting
							</AlertDialogAction>
						}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
