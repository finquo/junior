"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { OrderStatusZod } from "backend/db";
import {
	ExternalLinkIcon,
	MoreHorizontalIcon,
	PenIcon,
	PlusIcon,
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
import { DrawerTrigger } from "@/components/ui/drawer";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { snakeToTitleCase } from "@/lib/utils";
import { EditMaterialDrawer } from "./_components/edit-drawer";

type MaterialRecord = API_Returns["core"]["material"]["list"][number];

const orderOptions = OrderStatusZod.options.map((value) => ({
	label: snakeToTitleCase(value) ?? value,
	value,
}));

function MaterialActions({ material }: { material: MaterialRecord }) {
	return (
		<EditMaterialDrawer material={material}>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="icon-sm">
						<MoreHorizontalIcon />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem asChild>
						<Button variant="link" asChild>
							<Link href={`/materials/${material.id}` as "/"}>
								<ExternalLinkIcon />
								View Material
							</Link>
						</Button>
					</DropdownMenuItem>
					<DrawerTrigger asChild>
						<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
							<PenIcon />
							Edit Material
						</DropdownMenuItem>
					</DrawerTrigger>
				</DropdownMenuContent>
			</DropdownMenu>
		</EditMaterialDrawer>
	);
}

const columnHelper = createColumnHelper<DataTableFeatures, MaterialRecord>();

const columns: ColumnDef<DataTableFeatures, MaterialRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("name", {
			id: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Material" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Material",
				placeholder: "Search materials...",
				variant: "text",
			},
			cell: ({ row }) => (
				<Button variant="link" asChild>
					<Link href={`/materials/${row.original.id}` as "/"}>
						{row.original.name}
					</Link>
				</Button>
			),
		}),
		columnHelper.display({
			id: "student",
			header: () => "Student",
			enableSorting: false,
			cell: ({ row }) => {
				const student = row.original.student;
				if (!student) return <Badge variant="outline">Not Assigned</Badge>;
				return (
					<Button variant="link" asChild>
						<Link href={`/students/${student.id}` as "/"}>
							{student.user?.name}
						</Link>
					</Button>
				);
			},
		}),
		columnHelper.display({
			id: "lessons",
			header: () => "Lessons",
			enableSorting: false,
			cell: ({ row }) =>
				row.original.lessons.map((lessonId) => (
					<FetchLesson
						key={lessonId}
						id={lessonId}
						isPending={<Skeleton className="h-4 w-16" />}
					>
						{(lesson) => <Badge variant="secondary">{lesson.name}</Badge>}
					</FetchLesson>
				)),
		}),
		columnHelper.accessor("order", {
			id: "order",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Order" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Order",
				variant: "multiSelect",
				options: orderOptions,
			},
			cell: ({ getValue }) => (
				<Badge variant="outline">{snakeToTitleCase(getValue())}</Badge>
			),
		}),
		columnHelper.display({
			id: "scheduler",
			header: () => "Scheduler",
			enableSorting: false,
			cell: ({ row }) => {
				const scheduler = row.original.scheduler;
				if (!scheduler) return <Badge variant="outline">Not Assigned</Badge>;
				return (
					<Button variant="link" asChild>
						<Link href={`/schedulers/${scheduler.id}` as "/"}>
							{scheduler.user?.name}
						</Link>
					</Button>
				);
			},
		}),
		columnHelper.accessor("id", {
			id: "id",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Material ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				return (
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href={`/materials/${id}` as "/"}>{id}</Link>
						</Button>
						<CopyButton
							text={() => id}
							label="Material ID"
							variant="ghost"
							size="icon-sm"
						/>
					</ButtonGroup>
				);
			},
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
			header: () => null,
			size: 44,
			enableSorting: false,
			enableHiding: false,
			meta: { align: "right" },
			cell: ({ row }) => <MaterialActions material={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.core.material.list.queryOptions(),
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
				<FrameTitle>Materials</FrameTitle>
				<FrameDescription>
					Manage student material orders, lessons, and shipping
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button asChild>
							<Link href={"/materials/new" as "/"}>
								<PlusIcon />
								Create Material
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
