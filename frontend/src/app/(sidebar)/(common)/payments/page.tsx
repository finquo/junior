"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { format } from "date-fns";
import {
	ArrowLeftIcon,
	ExternalLinkIcon,
	MoreHorizontalIcon,
	PenIcon,
	PlusIcon,
} from "lucide-react";
import Link from "next/link";
import { getCurrencySymbol, getRelateTime } from "utils";
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
import { RenderWhenRole } from "@/hooks/role";
import { useDataTable } from "@/hooks/use-data-table";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";

type PaymentRecord = API_Returns["core"]["payment"]["list"][number];

function PaymentActions({ payment }: { payment: PaymentRecord }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon-sm">
					<MoreHorizontalIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem asChild>
					<Button variant="link" asChild>
						<Link href={`/payments/${payment.id}` as "/"}>
							<ExternalLinkIcon />
							View Payment
						</Link>
					</Button>
				</DropdownMenuItem>
				<RenderWhenRole role="admin">
					<DropdownMenuItem asChild>
						<Button variant="link" asChild>
							<Link href={`/payments/${payment.id}/edit` as "/"}>
								<PenIcon />
								Edit Payment
							</Link>
						</Button>
					</DropdownMenuItem>
				</RenderWhenRole>
				<DropdownMenuItem asChild>
					<Button variant="link" asChild>
						<Link href={`/students/${payment.studentId}` as "/"}>
							<ArrowLeftIcon />
							View Student
						</Link>
					</Button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const columnHelper = createColumnHelper<DataTableFeatures, PaymentRecord>();

const columns: ColumnDef<DataTableFeatures, PaymentRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("id", {
			id: "id",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Payment ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				if (!id) return null;
				return (
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href={`/payments/${id}` as "/"}>{id}</Link>
						</Button>
						<CopyButton
							text={() => id}
							label="Payment ID"
							variant="ghost"
							size="icon-sm"
						/>
					</ButtonGroup>
				);
			},
		}),
		columnHelper.accessor("studentId", {
			id: "student",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Student" />
			),
			enableSorting: false,
			cell: ({ getValue }) => {
				const studentId = getValue();
				if (!studentId) return null;
				return (
					<Button variant="link" asChild>
						<Link href={`/students/${studentId}` as "/"}>
							<FetchUser id={studentId}>{(user) => user.name}</FetchUser>
						</Link>
					</Button>
				);
			},
		}),
		columnHelper.accessor("amount", {
			id: "amount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Amount" />
			),
			enableSorting: true,
			cell: ({ row }) =>
				`${getCurrencySymbol(row.original.currency)}${row.original.amount.toLocaleString()}`,
		}),
		columnHelper.accessor("currency", {
			id: "currency",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Currency" />
			),
			enableSorting: true,
			cell: ({ getValue }) => getValue(),
		}),
		columnHelper.accessor("transactionId", {
			id: "transactionId",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Transaction ID" />
			),
			enableSorting: false,
			cell: ({ getValue }) => {
				const transactionId = getValue();
				if (!transactionId) return null;
				return (
					<CopyButton
						text={() => transactionId}
						label="Transaction ID"
						variant="ghost"
						size="sm"
					/>
				);
			},
		}),
		columnHelper.accessor("paidAt", {
			id: "paidAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Paid On" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const paidAt = getValue();
				if (!paidAt) return null;
				return format(new Date(paidAt), "MMM d, yyyy");
			},
		}),
		columnHelper.accessor("createdAt", {
			id: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Recorded" />
			),
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
			cell: ({ row }) => <PaymentActions payment={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.core.payment.list.queryOptions({ input: {} }),
	);

	const { table } = useDataTable({
		data,
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
				<FrameTitle>Payments</FrameTitle>
				<FrameDescription>
					Track offline payments recorded across all students
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<RenderWhenRole role="admin">
							<Button asChild>
								<Link href="/payments/new">
									<PlusIcon />
									Record Payment
								</Link>
							</Button>
						</RenderWhenRole>
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
