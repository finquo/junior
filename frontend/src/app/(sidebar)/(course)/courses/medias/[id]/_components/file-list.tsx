"use client";

import { useMutation } from "@tanstack/react-query";
import { getCourseVideoFileUrl } from "backend/config";
import {
	DownloadIcon,
	ExternalLinkIcon,
	FileIcon,
	FileJsonIcon,
	Trash2Icon,
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
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import { useHasRole } from "@/hooks/role";
import { formatBytes } from "@/hooks/use-file-upload";
import type { API_Returns } from "@/lib/api";
import { formatDate } from "@/lib/format";

type CourseVideoFile = API_Returns["stream"]["files"][number];

const isPlayableFile = (path: string) => /\.(mp4|m3u8)$/.test(path);

function getFileKind(path: string) {
	if (path === "source/video.mp4") {
		return { label: "Source", variant: "secondary" as const };
	}

	if (path === "hls/master.m3u8") {
		return { label: "HLS Master", variant: "success" as const };
	}

	if (path.startsWith("hls/") && path.endsWith(".m3u8")) {
		return { label: "HLS", variant: "success" as const };
	}

	if (path.startsWith("hls/")) {
		return { label: "Segment", variant: "outline" as const };
	}

	return { label: "Other", variant: "outline" as const };
}

function getFileIcon(path: string) {
	if (/\.(mp4|m3u8|ts)$/.test(path)) return <VideoIcon />;
	if (path.endsWith(".json")) return <FileJsonIcon />;
	return <FileIcon />;
}

function CourseVideoFileItem({
	file,
	videoId,
	canManage,
}: {
	file: CourseVideoFile;
	videoId: string;
	canManage: boolean;
}) {
	const name = file.path.split("/").pop() ?? file.path;
	const kind = getFileKind(file.path);
	const url = getCourseVideoFileUrl(videoId, file.path);
	const size = file.size === null ? "Unknown size" : formatBytes(file.size, 1);
	const updated =
		file.lastModified === null
			? null
			: formatDate(file.lastModified, {
					month: "short",
					day: "numeric",
					year: "numeric",
					hour: "numeric",
					minute: "2-digit",
				});
	const description = [size, updated, file.path].filter(Boolean).join(" · ");
	const download = useMutation(
		api.stream.downloadUrl.mutationOptions({
			onSuccess: ({ url: downloadUrl }) => {
				window.open(downloadUrl, "_blank", "noopener,noreferrer");
			},
			onError: () => {
				toast.error({ title: `Could not download ${name}` });
			},
		}),
	);

	return (
		<Item variant="outline">
			<ItemMedia>{getFileIcon(file.path)}</ItemMedia>
			<ItemContent>
				<ItemTitle>{name}</ItemTitle>
				<ItemDescription>{description}</ItemDescription>
			</ItemContent>
			<ItemActions>
				<Badge variant={kind.variant}>{kind.label}</Badge>
				{url && (
					<Button variant="ghost" size="icon-sm" asChild>
						<a
							href={url}
							target="_blank"
							rel="noreferrer"
							aria-label={`Open ${name}`}
						>
							<ExternalLinkIcon />
						</a>
					</Button>
				)}
				{canManage && (
					<>
						<Button
							variant="ghost"
							size="icon-sm"
							disabled={download.isPending}
							onClick={() => download.mutate({ videoId, path: file.path })}
							aria-label={`Download ${name}`}
						>
							<DownloadIcon />
						</Button>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									aria-label={`Delete ${name}`}
								>
									<Trash2Icon />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Delete {name}?</AlertDialogTitle>
									<AlertDialogDescription>
										This permanently removes {file.path} from S3. This cannot be
										undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<MutationButton
										api={api.stream.delete.mutationOptions({
											onSuccess: async () => {
												refetchAPIs([
													api.stream.files.queryKey({ input: { videoId } }),
													api.stream.list.queryKey(),
												]);
												toast.success({ title: "File deleted" });
											},
											onError: () => {
												toast.error({
													title: `Could not delete ${name}`,
												});
											},
										})}
										mutate={(mutate) => (
											<AlertDialogAction
												variant="destructive"
												onClick={() => mutate({ videoId, path: file.path })}
											>
												<Trash2Icon />
												Delete
											</AlertDialogAction>
										)}
										isPending={
											<AlertDialogAction variant="destructive" disabled>
												Deleting
											</AlertDialogAction>
										}
									/>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</>
				)}
			</ItemActions>
		</Item>
	);
}

export function CourseVideoFileList({
	files,
	videoId,
	playableOnly,
}: {
	files: CourseVideoFile[];
	videoId: string;
	playableOnly: boolean;
}) {
	const canManage = useHasRole(["admin", "scheduler"]);
	const visibleFiles = playableOnly
		? files.filter((file) => isPlayableFile(file.path))
		: files;

	if (visibleFiles.length === 0) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyTitle>No files</EmptyTitle>
					<EmptyDescription>
						No files have been stored for this video yet.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<ItemGroup>
			{visibleFiles.map((file) => (
				<CourseVideoFileItem
					key={file.path}
					file={file}
					videoId={videoId}
					canManage={canManage}
				/>
			))}
		</ItemGroup>
	);
}
