"use client";

import { useMutation } from "@tanstack/react-query";
import {
	DownloadIcon,
	EyeIcon,
	FileIcon,
	FileTextIcon,
	LinkIcon,
	Music2Icon,
	TrashIcon,
	VideoIcon,
} from "lucide-react";
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
import {
	Attachment,
	AttachmentAction,
	AttachmentActions,
	AttachmentContent,
	AttachmentDescription,
	AttachmentGroup,
	AttachmentMedia,
	AttachmentTitle,
} from "@/components/ui/attachment";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";

const fileIcon = (name: string) => {
	const extension = name.split(".").pop()?.toLowerCase();

	if (extension === "mp4" || extension === "webm") return <VideoIcon />;
	if (extension === "mp3" || extension === "m4a" || extension === "wav")
		return <Music2Icon />;
	if (extension === "json" || extension === "txt") return <FileTextIcon />;

	return <FileIcon />;
};

function MediaFile({ path, slotId }: { path: string; slotId: string }) {
	const name = path.split("/").pop() ?? path;

	const { mutate: getLink, isPending: isLinkPending } = useMutation(
		api.media.library.download.mutationOptions({
			onSuccess: async ({ url }) => {
				await navigator.clipboard.writeText(url);
				toast.success({ title: "Download link copied" });
			},
		}),
	);

	const { mutate: download, isPending: isDownloadPending } = useMutation(
		api.media.library.download.mutationOptions({
			onSuccess: ({ url }) => {
				window.open(url, "_blank", "noopener,noreferrer");
			},
		}),
	);

	const { mutate: view, isPending: isViewPending } = useMutation(
		api.media.library.download.mutationOptions({
			onSuccess: ({ url }) => {
				window.open(url, "_blank", "noopener,noreferrer");
			},
		}),
	);

	const { mutate: remove, isPending: isDeletePending } = useMutation(
		api.media.library.delete.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.media.library.files.queryKey({ input: { id: slotId } }),
				]);
				toast.success({ title: `${name} deleted` });
			},
		}),
	);

	const isBusy =
		isLinkPending || isDownloadPending || isViewPending || isDeletePending;

	return (
		<Attachment state={isBusy ? "processing" : "done"}>
			<AttachmentMedia>{fileIcon(name)}</AttachmentMedia>
			<AttachmentContent>
				<AttachmentTitle>{name}</AttachmentTitle>
				<AttachmentDescription>{path}</AttachmentDescription>
			</AttachmentContent>
			<AttachmentActions>
				<AttachmentAction
					aria-label={`View ${name}`}
					disabled={isBusy}
					onClick={() => view({ key: path, inline: true })}
				>
					{isViewPending ? <Spinner /> : <EyeIcon />}
				</AttachmentAction>
				<AttachmentAction
					aria-label={`Download ${name}`}
					disabled={isBusy}
					onClick={() => download({ key: path })}
				>
					{isDownloadPending ? <Spinner /> : <DownloadIcon />}
				</AttachmentAction>
				<AttachmentAction
					aria-label={`Get download link for ${name}`}
					disabled={isBusy}
					onClick={() => getLink({ key: path })}
				>
					{isLinkPending ? <Spinner /> : <LinkIcon />}
				</AttachmentAction>
				<RenderWhenRole role={["admin", "scheduler"]}>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<AttachmentAction aria-label={`Delete ${name}`} disabled={isBusy}>
								{isDeletePending ? <Spinner /> : <TrashIcon />}
							</AttachmentAction>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogMedia>
									<TrashIcon />
								</AlertDialogMedia>
								<AlertDialogTitle>Delete {name}?</AlertDialogTitle>
								<AlertDialogDescription>
									{path} will be removed from the bucket. This cannot be undone.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									variant="destructive"
									onClick={() => remove({ key: path })}
								>
									<TrashIcon />
									Delete
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</RenderWhenRole>
			</AttachmentActions>
		</Attachment>
	);
}

export function MediaFileList({
	files,
	slotId,
}: {
	files: string[];
	slotId: string;
}) {
	if (files.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>No files</EmptyTitle>
					<EmptyDescription>
						No media has been stored for this session yet.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{files.map((path) => (
				<MediaFile key={path} path={path} slotId={slotId} />
			))}
		</div>
	);
}
