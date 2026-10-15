"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Countries, type CountryCodes } from "backend/config";
import {
	ExternalLinkIcon,
	MoreHorizontalIcon,
	ScanEyeIcon,
} from "lucide-react";
import Link from "next/link";
import { CopyButton } from "@/components/copy";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
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
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { api } from "@/hooks/api";
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";

type ProgramRecord = API_Returns["core"]["program"]["list"][number];

const currencySymbol: Record<CountryCodes, string> = {
	IN: "₹",
	US: "$",
};

function formatPrice(code: CountryCodes, amount: number) {
	return `${currencySymbol[code]}${amount.toLocaleString()}`;
}

function ProgramDrawer({ program }: { program: ProgramRecord }) {
	return (
		<DrawerContent>
			<DrawerHeader>
				<DrawerTitle>{program.name}</DrawerTitle>
				<DrawerDescription>{program.description}</DrawerDescription>
			</DrawerHeader>
			<DrawerInner>
				<Table>
					<TableBody>
						<TableRow>
							<TableCell className="font-medium">Program ID</TableCell>
							<TableCell>{program.id}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">Lessons</TableCell>
							<TableCell>{program.count}</TableCell>
						</TableRow>
						{Object.entries(program.price).map(([code, amount]) => (
							<TableRow key={code}>
								<TableCell className="font-medium">
									{Countries[code as CountryCodes] ?? code}
								</TableCell>
								<TableCell>
									{formatPrice(code as CountryCodes, amount)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</DrawerInner>
			<DrawerFooter>
				<CopyButton
					text={() => program.id}
					label="Program ID"
					variant="outline"
				/>
				<Button asChild>
					<Link href={`/programs/${program.id}` as "/"}>Open Program Page</Link>
				</Button>
				<DrawerClose asChild>
					<Button variant="outline">Close</Button>
				</DrawerClose>
			</DrawerFooter>
		</DrawerContent>
	);
}

function ProgramActions({ program }: { program: ProgramRecord }) {
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
						<Button variant="link" asChild>
							<Link href={`/programs/${program.id}` as "/"}>
								<ExternalLinkIcon />
								View Program Page
							</Link>
						</Button>
					</DropdownMenuItem>
					<DrawerTrigger asChild>
						<DropdownMenuItem onSelect={(event) => event.preventDefault()}>
							<ScanEyeIcon />
							Quick View
						</DropdownMenuItem>
					</DrawerTrigger>
				</DropdownMenuContent>
			</DropdownMenu>
			<ProgramDrawer program={program} />
		</Drawer>
	);
}

const columnHelper = createColumnHelper<DataTableFeatures, ProgramRecord>();

const priceColumns = (Object.keys(Countries) as CountryCodes[]).map((code) =>
	columnHelper.accessor((row) => row.price[code], {
		id: `price-${code}`,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label={`Price (${code})`} />
		),
		enableSorting: true,
		meta: { align: "right" },
		cell: ({ getValue }) => formatPrice(code, getValue()),
	}),
);

const columns: ColumnDef<DataTableFeatures, ProgramRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("name", {
			id: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Program" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Program",
				placeholder: "Search programs...",
				variant: "text",
			},
			cell: ({ row }) => {
				const program = row.original;
				return (
					<Drawer>
						<DrawerTrigger asChild>
							<Item>
								<ItemContent>
									<ItemTitle>{program.name}</ItemTitle>
									<ItemDescription>{program.description}</ItemDescription>
								</ItemContent>
							</Item>
						</DrawerTrigger>
						<ProgramDrawer program={program} />
					</Drawer>
				);
			},
		}),
		columnHelper.accessor("id", {
			id: "id",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Program ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				if (!id) return null;
				return (
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href={`/programs/${id}` as "/"}>{id}</Link>
						</Button>
						<CopyButton
							text={() => id}
							label="Program ID"
							variant="ghost"
							size="icon-sm"
						/>
					</ButtonGroup>
				);
			},
		}),
		columnHelper.accessor("count", {
			id: "count",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Lessons" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: { label: "Lessons", variant: "number", unit: "lessons" },
			cell: ({ getValue }) => getValue(),
		}),
		...priceColumns,
		columnHelper.display({
			id: "actions",
			header: () => null,
			size: 44,
			enableSorting: false,
			enableHiding: false,
			meta: { align: "right" },
			cell: ({ row }) => <ProgramActions program={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [] } = useQuery(api.core.program.list.queryOptions());

	const { table } = useDataTable({
		data,
		columns,
		mode: "client",
		initialState: {
			sorting: [{ id: "name", desc: false }],
			pagination: { pageIndex: 0, pageSize: 10 },
			columnVisibility: { id: false },
		},
		getRowId: (row) => row.id,
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Programs</FrameTitle>
				<FrameDescription>
					Explore the platform programs and pricing
				</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<DataTable table={table}>
					<DataTableToolbar table={table} />
				</DataTable>
			</FramePanel>
		</Frame>
	);
}
