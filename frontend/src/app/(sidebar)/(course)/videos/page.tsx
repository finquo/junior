"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import {
	ExternalLinkIcon,
	MoreHorizontalIcon,
	PenIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { getRelateTime } from "utils";
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
import {
	DropdownMenu,
	DropdownMenuActionItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { api } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { VideoDeleteButton } from "../_components/content-actions";
import { VideoUpdateForm } from "../_components/video-update";

type VideoRecord = API_Returns["core"]["video"]["list"][number] & {
	courseName: string;
};

function VideoActions({ video }: { video: VideoRecord }) {
	const videoHref = video.module
		? (`/videos/${video.id}` as "/")
		: ("/modules" as "/");

	return (
		<Drawer>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="icon-sm">
						<MoreHorizontalIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem asChild>
						<Link href={videoHref}>
							<ExternalLinkIcon />
							View Video Page
						</Link>
					</DropdownMenuItem>
					<DrawerTrigger asChild>
						<DropdownMenuActionItem>
							<PenIcon />
							Quick View
						</DropdownMenuActionItem>
					</DrawerTrigger>
					<RenderWhenRole role={["admin", "scheduler"]}>
						<VideoUpdateForm courseId={video.course} video={video}>
							<DropdownMenuActionItem
								onSelect={(event) => event.preventDefault()}
							>
								<PenIcon />
								Edit Video
							</DropdownMenuActionItem>
						</VideoUpdateForm>
					</RenderWhenRole>
					<RenderWhenRole role={["admin", "scheduler"]}>
						<VideoDeleteButton
							videoId={video.id}
							courseId={video.course}
							moduleId={video.module ?? ""}
							name={video.name}
							navigateOnSuccess={false}
						>
							<DropdownMenuActionItem
								variant="destructive"
								onSelect={(event) => event.preventDefault()}
							>
								<Trash2Icon />
								Delete Video
							</DropdownMenuActionItem>
						</VideoDeleteButton>
					</RenderWhenRole>
				</DropdownMenuContent>
			</DropdownMenu>

			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>{video.name}</DrawerTitle>
					<DrawerDescription>Video details</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="font-medium">Video ID</TableCell>
								<TableCell>{video.id}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">Course</TableCell>
								<TableCell>{video.courseName}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">Module</TableCell>
								<TableCell>{video.moduleName}</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</DrawerInner>
				<DrawerFooter>
					<CopyButton
						text={() => video.id}
						label="Video ID"
						variant="outline"
					/>
					<Button asChild>
						<Link href={videoHref}>Open Full Page</Link>
					</Button>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

const columnHelper = createColumnHelper<DataTableFeatures, VideoRecord>();

const columns: ColumnDef<DataTableFeatures, VideoRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("name", {
			id: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Video" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Video",
				placeholder: "Search videos...",
				variant: "text",
			},
			cell: ({ row }) => {
				const video = row.original;
				return (
					<Button variant="link" asChild className="h-auto p-0">
						<Link href={`/videos/${video.id}` as "/"}>
							<Item>
								<ItemContent>
									<ItemTitle>{video.name}</ItemTitle>
									{video.description && (
										<ItemDescription>{video.description}</ItemDescription>
									)}
								</ItemContent>
							</Item>
						</Link>
					</Button>
				);
			},
		}),
		columnHelper.accessor("id", {
			id: "id",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Video ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				if (!id) return null;
				return (
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href={`/videos/${id}` as "/"}>{id}</Link>
						</Button>
						<CopyButton text={() => id} label="Video ID" />
					</ButtonGroup>
				);
			},
		}),
		columnHelper.accessor("moduleName", {
			id: "moduleName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Module" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Module",
				placeholder: "Search modules...",
				variant: "text",
			},
			cell: ({ row, getValue }) => {
				const moduleName = getValue();
				if (!moduleName) return null;
				return (
					<Button variant="link" asChild className="h-auto p-0">
						<Link href={`/modules/${row.original.module}` as "/"}>
							<Badge variant="outline">{moduleName}</Badge>
						</Link>
					</Button>
				);
			},
		}),
		columnHelper.accessor("courseName", {
			id: "courseName",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Course" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Course",
				placeholder: "Search courses...",
				variant: "text",
			},
			cell: ({ row }) => (
				<Button variant="link" asChild className="h-auto p-0">
					<Link href={`/courses/${row.original.course}` as "/"}>
						<Badge variant="outline">{row.original.courseName}</Badge>
					</Link>
				</Button>
			),
		}),
		columnHelper.accessor("createdAt", {
			id: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Created" />
			),
			enableSorting: true,
			cell: ({ getValue }) => `${getRelateTime(new Date(getValue()))} ago`,
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => <VideoActions video={row.original} />,
		}),
	]);

export default function Page() {
	const { data: modules = [], isPending: isModulesPending } = useQuery(
		api.core.module.listAll.queryOptions(),
	);

	const courseIds = [...new Set(modules.map((module) => module.course))];
	const videoQueries = useQueries({
		queries: courseIds.map((courseId) =>
			api.core.video.list.queryOptions({ input: { course: courseId } }),
		),
	});

	const modulesById = new Map(modules.map((module) => [module.id, module]));
	const videos: VideoRecord[] = videoQueries.flatMap((result) =>
		(result.data ?? []).map((video) => ({
			...video,
			courseName:
				(video.module && modulesById.get(video.module)?.courseName) ??
				"Unknown course",
		})),
	);
	const isPending =
		isModulesPending || videoQueries.some((query) => query.isPending);

	const { table } = useDataTable({
		data: videos,
		columns,
		mode: "client",
		initialState: {
			sorting: [{ id: "createdAt", desc: true }],
			pagination: { pageIndex: 0, pageSize: 10 },
			columnVisibility: { id: false },
		},
		getRowId: (row) => row.id,
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Videos</FrameTitle>
				<FrameDescription>
					Browse course video metadata across all modules
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button asChild>
							<Link href="/videos/new">
								<PlusIcon />
								Create Video
							</Link>
						</Button>
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
