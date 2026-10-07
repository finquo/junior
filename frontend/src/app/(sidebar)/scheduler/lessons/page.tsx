"use client";

import { useQuery } from "@tanstack/react-query";
import {
	type ColumnDef,
	columnFilteringFeature,
	columnVisibilityFeature,
	createColumnHelper,
	createFilteredRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	filterFn_includesString,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_text,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { Languages, type LessonType } from "backend/config";
import { PenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { getRelateTime } from "utils";
import Loader from "@/components/loader";
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@/components/ui/item";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";

const features = tableFeatures({
	columnFilteringFeature,
	columnVisibilityFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	filteredRowModel: createFilteredRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	sortedRowModel: createSortedRowModel(),
	filterFns: { includesString: filterFn_includesString },
	sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

type DataTableFeatures = typeof features;

type LessonRecord = API_Returns["scheduler"]["getLessons"][number];

const columnHelper = createColumnHelper<DataTableFeatures, LessonRecord>();

const columns: ColumnDef<DataTableFeatures, LessonRecord>[] =
	columnHelper.columns([
		columnHelper.display({
			id: "lesson",
			header: "Lesson",
			cell: ({ row }) => {
				const lesson = row.original;
				return (
					<Drawer>
						<DrawerTrigger
							nativeButton={false}
							render={
								<Item className="cursor-pointer p-0 text-left transition-opacity hover:opacity-80" />
							}
						>
							<ItemContent>
								<ItemTitle>{lesson.name}</ItemTitle>
								{lesson.description && (
									<ItemDescription className="line-clamp-1">
										{lesson.description}
									</ItemDescription>
								)}
							</ItemContent>
						</DrawerTrigger>
						<DrawerContent className="overflow-y-auto">
							<DrawerHeader>
								<DrawerTitle>{lesson.name}</DrawerTitle>
								<DrawerDescription>
									{lesson.description ?? "No description provided"}
								</DrawerDescription>
							</DrawerHeader>
							<div className="flex flex-col gap-4 p-4">
								<Table>
									<TableBody>
										<TableRow>
											<TableCell className="font-medium">Lesson ID</TableCell>
											<TableCell>{lesson.id}</TableCell>
										</TableRow>
										<TableRow>
											<TableCell className="font-medium">Language</TableCell>
											<TableCell>
												<Badge variant="secondary">
													{Languages[
														lesson.language as keyof typeof Languages
													] ?? lesson.language}
												</Badge>
											</TableCell>
										</TableRow>
										{lesson.period && (
											<TableRow>
												<TableCell className="font-medium">Duration</TableCell>
												<TableCell>{String(lesson.period)}</TableCell>
											</TableRow>
										)}
										<TableRow>
											<TableCell className="font-medium">Created</TableCell>
											<TableCell>
												{new Date(lesson.createdAt).toLocaleDateString()}
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell className="font-medium">
												Last Updated
											</TableCell>
											<TableCell>
												{new Date(lesson.updatedAt).toLocaleDateString()}
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
							<DrawerFooter>
								<DrawerClose render={<Button variant="outline" />}>
									Close
								</DrawerClose>
							</DrawerFooter>
						</DrawerContent>
					</Drawer>
				);
			},
		}),
		columnHelper.accessor("language", {
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Language</TooltipTrigger>
					<TooltipContent>Instruction medium of the lesson</TooltipContent>
				</Tooltip>
			),
			cell: ({ getValue }) => {
				const val = getValue();
				return (
					<Badge variant="secondary">
						{Languages[val as keyof typeof Languages] ?? val}
					</Badge>
				);
			},
		}),
		columnHelper.accessor("period", {
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Period</TooltipTrigger>
					<TooltipContent>Duration or interval of the lesson</TooltipContent>
				</Tooltip>
			),
			cell: ({ getValue }) => {
				const val = getValue();
				return val ? String(val) : "—";
			},
		}),
		columnHelper.accessor("createdAt", {
			header: "Created",
			cell: ({ getValue }) => `${getRelateTime(new Date(getValue()))} ago`,
		}),
		columnHelper.display({
			id: "edit",
			header: "Edit",
			cell: ({ row }) => (
				<Drawer>
					<DrawerTrigger
						render={
							<Button variant="outline" size="icon-sm">
								<PenIcon />
							</Button>
						}
					/>
					<DrawerContent className="overflow-y-auto">
						<DrawerHeader>
							<DrawerTitle>Edit Lesson</DrawerTitle>
							<DrawerDescription>Edit {row.original.name}</DrawerDescription>
						</DrawerHeader>
						<div className="p-4" />
						<DrawerFooter>
							<DrawerClose render={<Button variant="outline" />}>
								Close
							</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			),
		}),
	]);

export default function Page() {
	const { data: lessons = [], isPending } = useQuery(
		api.scheduler.getLessons.queryOptions(),
	);

	const table = useTable({
		features,
		data: lessons,
		columns,
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<TooltipProvider>
			<Frame>
				<FrameHeader className="flex flex-row items-center justify-end">
					<Button
						render={<Link href="/scheduler/lessons/new" />}
						nativeButton={false}
					>
						<PlusIcon />
						Create Lesson
					</Button>
				</FrameHeader>
				<FramePanel className="p-0!">
					<Table>
						<TableHeader>
							{table.getHeaderGroups().map((headerGroup) => (
								<TableRow key={headerGroup.id}>
									{headerGroup.headers.map((header) => (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: typeof header.column.columnDef.header === "function"
													? header.column.columnDef.header(header.getContext())
													: header.column.columnDef.header}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{typeof cell.column.columnDef.cell === "function"
													? cell.column.columnDef.cell(cell.getContext())
													: cell.getValue()}
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell
										colSpan={columns.length}
										className="h-24 text-center"
									>
										No lessons found.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</FramePanel>
			</Frame>
		</TooltipProvider>
	);
}
