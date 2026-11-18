"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import {
	ExternalLinkIcon,
	MoreHorizontalIcon,
	TrashIcon,
	VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { sileo as toast } from "sileo";
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
import { ButtonGroup } from "@/components/ui/button-group";
import {
	DropdownMenu,
	DropdownMenuActionItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { MutationButton } from "@/hooks/button";
import { RenderWhenRole } from "@/hooks/role";
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";

type LibraryRecord = API_Returns["media"]["library"]["list"][number];

const columnHelper = createColumnHelper<DataTableFeatures, LibraryRecord>();

const columns: ColumnDef<DataTableFeatures, LibraryRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("slotId", {
			id: "slotId",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Session ID" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Session ID",
				placeholder: "Search sessions...",
				variant: "text",
			},
			cell: ({ getValue }) => {
				const id = getValue();
				return (
					<Button variant="link" asChild>
						<Link href={`/medias/${id}` as "/"}>{id}</Link>
					</Button>
				);
			},
		}),
		columnHelper.accessor((row) => row.files.length, {
			id: "files",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Files" />
			),
			enableSorting: true,
			cell: ({ getValue }) => <Badge variant="secondary">{getValue()}</Badge>,
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			size: 44,
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon-sm">
							<MoreHorizontalIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Link href={`/medias/${row.original.slotId}` as "/"}>
								<ExternalLinkIcon />
								Open Media
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							<Link href={`/slots/${row.original.slotId}/media` as "/"}>
								<VideoIcon />
								Open Slot
							</Link>
						</DropdownMenuItem>
						<CopyButton text={() => row.id} label="Slot ID" showText asChild>
							<DropdownMenuActionItem />
						</CopyButton>
						<RenderWhenRole role={["admin", "scheduler"]}>
							<DeleteSlotButton slotId={row.id}>
								<DropdownMenuActionItem variant="destructive">
									<TrashIcon />
									Delete Media
								</DropdownMenuActionItem>
							</DeleteSlotButton>
						</RenderWhenRole>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		}),
	]);

function DeleteSlotButton({
	slotId,
	children,
}: {
	slotId: string;
	children: React.ReactElement;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete all files for {slotId}?</AlertDialogTitle>
					<AlertDialogDescription>
						Every recording, audio, chunk, transcript, and summary under this
						session will be removed. This cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<MutationButton
						api={api.media.library.deleteSlot.mutationOptions({
							onSuccess: ({ deleted }) => {
								refetchAPIs([api.media.library.list.queryKey()]);
								toast.success({
									title: `Deleted ${deleted} files for ${slotId}`,
								});
							},
						})}
						mutate={(mutate) => (
							<AlertDialogAction
								variant="destructive"
								onClick={() => mutate({ id: slotId })}
							>
								<TrashIcon />
								Delete
							</AlertDialogAction>
						)}
						isPending={
							<AlertDialogAction variant="destructive">
								<TrashIcon />
								Deleting
							</AlertDialogAction>
						}
					/>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.media.library.list.queryOptions(),
	);

	const { table } = useDataTable({
		data,
		columns,
		mode: "client",
		initialState: {
			sorting: [{ id: "files", desc: true }],
			pagination: { pageIndex: 0, pageSize: 10 },
		},
		getRowId: (row) => row.slotId,
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Medias</FrameTitle>
				<FrameDescription>
					Recording and media files grouped by session
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
