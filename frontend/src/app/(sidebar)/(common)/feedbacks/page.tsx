"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { FeedbackStatusZod, FeedbackTypeZod } from "backend/db";
import { ExternalLinkIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { getRelateTime } from "utils";
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
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/hooks/api";
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";

type FeedbackRecord = API_Returns["feedback"]["list"][number];

const statusBadge: Record<
	(typeof FeedbackStatusZod.options)[number],
	"success" | "warning" | "outline"
> = {
	pending: "warning",
	resolved: "success",
	unresolvable: "outline",
};

const typeOptions = FeedbackTypeZod.options.map((type) => ({
	value: type,
	label: type,
}));

const statusOptions = FeedbackStatusZod.options.map((status) => ({
	value: status,
	label: status,
}));

const columnHelper = createColumnHelper<DataTableFeatures, FeedbackRecord>();

const columns: ColumnDef<DataTableFeatures, FeedbackRecord>[] =
	columnHelper.columns([
		columnHelper.accessor((row) => row.user?.name, {
			id: "user",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="From" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: { label: "From", placeholder: "Search users...", variant: "text" },
			cell: ({ row }) =>
				row.original.user?.name ?? <Badge variant="outline">Anonymous</Badge>,
		}),
		columnHelper.accessor("content", {
			id: "content",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Content" />
			),
			enableColumnFilter: true,
			enableSorting: false,
			meta: {
				label: "Content",
				placeholder: "Search feedback...",
				variant: "text",
			},
			cell: ({ getValue }) => (
				<span className="line-clamp-2 max-w-md whitespace-normal">
					{getValue()}
				</span>
			),
		}),
		columnHelper.accessor("type", {
			id: "type",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Type" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: { label: "Type", variant: "multiSelect", options: typeOptions },
			cell: ({ getValue }) => <Badge variant="outline">{getValue()}</Badge>,
		}),
		columnHelper.accessor("status", {
			id: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Status" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Status",
				variant: "multiSelect",
				options: statusOptions,
			},
			cell: ({ getValue }) => (
				<Badge variant={statusBadge[getValue()]}>{getValue()}</Badge>
			),
		}),
		columnHelper.accessor("ref", {
			id: "ref",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Reference" />
			),
			enableColumnFilter: false,
			enableSorting: false,
			cell: ({ getValue }) => getValue() ?? null,
		}),
		columnHelper.accessor("createdAt", {
			id: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Submitted" />
			),
			enableColumnFilter: false,
			enableSorting: true,
			cell: ({ getValue }) => `${getRelateTime(new Date(getValue()))} ago`,
		}),
		columnHelper.display({
			id: "actions",
			header: () => null,
			size: 44,
			enableSorting: false,
			enableHiding: false,
			meta: { align: "right" },
			cell: ({ row }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon-sm">
							<MoreHorizontalIcon />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem asChild>
							<Button variant="link" asChild>
								<Link href={`/feedbacks/${row.id}` as "/"}>
									<ExternalLinkIcon />
									View Feedback
								</Link>
							</Button>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			),
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(api.feedback.list.queryOptions());

	const { table } = useDataTable({
		data,
		columns,
		mode: "client",
		initialState: {
			sorting: [{ id: "createdAt", desc: true }],
			pagination: { pageIndex: 0, pageSize: 10 },
		},
		getRowId: (row) => row.id,
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Feedbacks</FrameTitle>
				<FrameDescription>
					Reports and feedback submitted from calls and the dashboard
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button asChild>
							<Link href="/feedbacks/new">
								<PlusIcon />
								Create Feedback
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
