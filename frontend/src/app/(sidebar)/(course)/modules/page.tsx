"use client";

import { useQuery } from "@tanstack/react-query";
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
import { ModuleDeleteButton } from "../_components/content-actions";
import { ModuleForm } from "../_components/module-form";

type ModuleRecord = API_Returns["core"]["module"]["listAll"][number];

function ModuleActions({ module }: { module: ModuleRecord }) {
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
						<Link href={`/modules/${module.id}` as "/"}>
							<ExternalLinkIcon />
							View Module Page
						</Link>
					</DropdownMenuItem>
					<DrawerTrigger asChild>
						<DropdownMenuActionItem>
							<PenIcon />
							Quick View
						</DropdownMenuActionItem>
					</DrawerTrigger>
					<RenderWhenRole role={["admin", "scheduler"]}>
						<ModuleForm courseId={module.course} module={module}>
							<DropdownMenuActionItem
								onSelect={(event) => event.preventDefault()}
							>
								<PenIcon />
								Edit Module
							</DropdownMenuActionItem>
						</ModuleForm>
					</RenderWhenRole>
					<RenderWhenRole role={["admin", "scheduler"]}>
						<ModuleDeleteButton
							moduleId={module.id}
							courseId={module.course}
							name={module.name}
						>
							<DropdownMenuActionItem
								variant="destructive"
								onSelect={(event) => event.preventDefault()}
							>
								<Trash2Icon />
								Delete Module
							</DropdownMenuActionItem>
						</ModuleDeleteButton>
					</RenderWhenRole>
				</DropdownMenuContent>
			</DropdownMenu>

			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>{module.name}</DrawerTitle>
					<DrawerDescription>Module details</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="font-medium">Module ID</TableCell>
								<TableCell>{module.id}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">Course</TableCell>
								<TableCell>{module.courseName}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">Videos</TableCell>
								<TableCell>{module.videoCount}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">Quiz Questions</TableCell>
								<TableCell>{module.quiz?.length ?? 0}</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</DrawerInner>
				<DrawerFooter>
					<CopyButton
						text={() => module.id}
						label="Module ID"
						variant="outline"
					/>
					<Button asChild>
						<Link href={`/modules/${module.id}` as "/"}>Open Full Page</Link>
					</Button>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

const columnHelper = createColumnHelper<DataTableFeatures, ModuleRecord>();

const columns: ColumnDef<DataTableFeatures, ModuleRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("name", {
			id: "name",
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
			cell: ({ row }) => {
				const module = row.original;
				return (
					<Button variant="link" asChild className="h-auto p-0">
						<Link href={`/modules/${module.id}` as "/"}>
							<Item>
								<ItemContent>
									<ItemTitle>{module.name}</ItemTitle>
									{module.description && (
										<ItemDescription>{module.description}</ItemDescription>
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
				<DataTableColumnHeader column={column} label="Module ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				if (!id) return null;
				return (
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href={`/modules/${id}` as "/"}>{id}</Link>
						</Button>
						<CopyButton text={() => id} label="Module ID" />
					</ButtonGroup>
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
			cell: ({ row }) => {
				const module = row.original;
				return (
					<Button variant="link" asChild className="h-auto p-0">
						<Link href={`/courses/${module.course}` as "/"}>
							<Badge variant="outline">{module.courseName}</Badge>
						</Link>
					</Button>
				);
			},
		}),
		columnHelper.accessor("videoCount", {
			id: "videoCount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Videos" />
			),
			enableSorting: true,
			meta: { label: "Videos", variant: "number" },
			cell: ({ getValue }) => getValue(),
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
			cell: ({ row }) => <ModuleActions module={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.core.module.listAll.queryOptions(),
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
				<FrameTitle>Modules</FrameTitle>
				<FrameDescription>
					Manage course modules, quiz questions, and videos
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<RenderWhenRole role={["admin", "scheduler"]}>
							<Button asChild>
								<Link href="/modules/new">
									<PlusIcon />
									Create Module
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
