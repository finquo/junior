"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { getCourseVideoFileUrl } from "backend/config";
import {
	ExternalLinkIcon,
	FolderOpenIcon,
	MoreHorizontalIcon,
	VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/copy";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuActionItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/hooks/api";
import { useDataTable } from "@/hooks/use-data-table";
import { formatBytes } from "@/hooks/use-file-upload";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { formatDate } from "@/lib/format";

type CourseMediaRecord = API_Returns["stream"]["list"][number];

const columnHelper = createColumnHelper<DataTableFeatures, CourseMediaRecord>();

const columns: ColumnDef<DataTableFeatures, CourseMediaRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("videoId", {
			id: "videoId",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Video ID" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Video ID",
				placeholder: "Search video IDs...",
				variant: "text",
			},
			cell: ({ getValue }) => {
				const id = getValue();
				return (
					<Button variant="link" asChild>
						<Link href={`/courses/medias/${id}` as "/"}>{id}</Link>
					</Button>
				);
			},
		}),
		columnHelper.accessor((row) => row.source.size, {
			id: "sourceSize",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Source Size" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const size = getValue();
				return size === null ? null : <Badge>{formatBytes(size, 1)}</Badge>;
			},
		}),
		columnHelper.accessor((row) => row.source.lastModified, {
			id: "sourceUpdated",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Source Updated" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const updated = getValue();
				return updated === null
					? null
					: formatDate(updated, {
							month: "short",
							day: "numeric",
							year: "numeric",
							hour: "numeric",
							minute: "2-digit",
						});
			},
		}),
		columnHelper.accessor((row) => row.hls !== null, {
			id: "hls",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="HLS" />
			),
			enableSorting: true,
			cell: ({ getValue }) =>
				getValue() ? (
					<Badge variant="success">Ready</Badge>
				) : (
					<Badge variant="outline">Not Ready</Badge>
				),
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			size: 44,
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => {
				const videoId = row.original.videoId;
				const sourceUrl = getCourseVideoFileUrl(videoId, "source/video.mp4");
				const hlsUrl = getCourseVideoFileUrl(videoId, "hls/master.m3u8");

				return (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon-sm">
								<MoreHorizontalIcon />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link href={`/courses/medias/${videoId}` as "/"}>
									<FolderOpenIcon />
									View Files
								</Link>
							</DropdownMenuItem>
							{sourceUrl && (
								<DropdownMenuItem asChild>
									<a href={sourceUrl} target="_blank" rel="noreferrer">
										<ExternalLinkIcon />
										Open Source
									</a>
								</DropdownMenuItem>
							)}
							{hlsUrl && row.original.hls && (
								<DropdownMenuItem asChild>
									<a href={hlsUrl} target="_blank" rel="noreferrer">
										<VideoIcon />
										Open HLS
									</a>
								</DropdownMenuItem>
							)}
							<CopyButton text={() => videoId} label="Video ID" asChild>
								<DropdownMenuActionItem />
							</CopyButton>
						</DropdownMenuContent>
					</DropdownMenu>
				);
			},
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(api.stream.list.queryOptions());

	const { table } = useDataTable({
		data,
		columns,
		mode: "client",
		initialState: {
			sorting: [{ id: "sourceUpdated", desc: true }],
			pagination: { pageIndex: 0, pageSize: 10 },
		},
		getRowId: (row) => row.videoId,
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Course Medias</FrameTitle>
				<FrameDescription>
					Course videos stored in S3 with source and HLS metadata
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
					</ButtonGroup>
				</FrameActions>
			</FrameHeader>
			<FramePanel>
				<DataTable table={table}>
					<DataTableToolbar table={table} />
				</DataTable>
			</FramePanel>
		</Frame>
	);
}
