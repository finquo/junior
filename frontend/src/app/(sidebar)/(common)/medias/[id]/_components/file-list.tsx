"use client";

import { useMutation } from "@tanstack/react-query";
import {
	DownloadIcon,
	FileIcon,
	FileTextIcon,
	LinkIcon,
	Music2Icon,
	VideoIcon,
} from "lucide-react";
import { sileo as toast } from "sileo";
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
import { api } from "@/hooks/api";

const fileIcon = (name: string) => {
	const extension = name.split(".").pop()?.toLowerCase();

	if (extension === "mp4" || extension === "webm") return <VideoIcon />;
	if (extension === "mp3" || extension === "m4a" || extension === "wav")
		return <Music2Icon />;
	if (extension === "json" || extension === "txt") return <FileTextIcon />;

	return <FileIcon />;
};

function MediaFile({ path }: { path: string }) {
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

	const isBusy = isLinkPending || isDownloadPending;

	return (
		<Attachment orientation={"vertical"} state={isBusy ? "processing" : "done"}>
			<AttachmentMedia>{fileIcon(name)}</AttachmentMedia>
			<AttachmentContent>
				<AttachmentTitle>{name}</AttachmentTitle>
				<AttachmentDescription>{path}</AttachmentDescription>
			</AttachmentContent>
			<AttachmentActions>
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
			</AttachmentActions>
		</Attachment>
	);
}

export function MediaFileList({ files }: { files: string[] }) {
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
		<AttachmentGroup>
			{files.map((path) => (
				<MediaFile key={path} path={path} />
			))}
		</AttachmentGroup>
	);
}
