"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ExternalLinkIcon } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/hooks/api";
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
				<Button variant="outline" size="icon-sm" asChild>
					<Link href={`/medias/${row.original.slotId}` as "/"}>
						<ExternalLinkIcon />
					</Link>
				</Button>
			),
		}),
	]);

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
