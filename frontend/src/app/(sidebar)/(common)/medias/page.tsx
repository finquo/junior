"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ExternalLinkIcon, TrashIcon, VideoIcon } from "lucide-react";
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
	AlertDialogMedia,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
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
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href={`/medias/${id}` as "/"}>{id}</Link>
						</Button>
						<CopyButton
							text={() => id}
							label="Session ID"
							variant="ghost"
							size="icon-sm"
						/>
					</ButtonGroup>
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
			header: () => null,
			size: 44,
			enableSorting: false,
			enableHiding: false,
			meta: { align: "right" },
			cell: ({ row }) => (
				<ButtonGroup>
					<Button variant="outline" size="icon-sm" asChild>
						<Link href={`/medias/${row.original.slotId}` as "/"}>
							<ExternalLinkIcon />
						</Link>
					</Button>
					<Button variant="outline" size="icon-sm" asChild>
						<Link href={`/slots/${row.original.slotId}/media` as "/"}>
							<VideoIcon />
						</Link>
					</Button>
					<DeleteSlotButton slotId={row.original.slotId} />
				</ButtonGroup>
			),
		}),
	]);

function DeleteSlotButton({ slotId }: { slotId: string }) {
	const { mutate, isPending } = useMutation(
		api.media.library.deleteSlot.mutationOptions({
			onSuccess: ({ deleted }) => {
				refetchAPIs([api.media.library.list.queryKey()]);
				toast.success({ title: `Deleted ${deleted} files for ${slotId}` });
			},
		}),
	);

	return (
		<RenderWhenRole role={["admin", "scheduler"]}>
			<AlertDialog>
				<AlertDialogTrigger asChild>
					<Button variant="outline" size="icon-sm" disabled={isPending}>
						{isPending ? <Spinner /> : <TrashIcon />}
					</Button>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogMedia>
							<TrashIcon />
						</AlertDialogMedia>
						<AlertDialogTitle>Delete all files for {slotId}?</AlertDialogTitle>
						<AlertDialogDescription>
							Every recording, audio, chunk, transcript, and summary under this
							session will be removed. This cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => mutate({ id: slotId })}
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
