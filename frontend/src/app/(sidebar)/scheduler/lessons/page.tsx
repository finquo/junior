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
import { Languages } from "backend/config";
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
			id: "name",
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
									{Languages[lesson.language as keyof typeof Languages] ??
										lesson.language}
								</DrawerDescription>
							</DrawerHeader>
							<div className="flex flex-col gap-4 p-4 text-sm">
								<div>
									<span className="font-medium text-muted-foreground">
										Description:
									</span>
									<p className="mt-1">
										{lesson.description || "No description provided."}
									</p>
								</div>
								<div className="flex gap-6">
									<div>
										<span className="font-medium text-muted-foreground">
											Language:
										</span>
										<p>
											{Languages[lesson.language as keyof typeof Languages] ??
												lesson.language}
										</p>
									</div>
									<div>
										<span className="font-medium text-muted-foreground">
											Duration:
										</span>
										<p>
											{lesson.period
												? `${lesson.period} mins`
												: "Not specified"}
										</p>
									</div>
								</div>
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
		columnHelper.display({
			id: "language",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
						Language
					</TooltipTrigger>
					<TooltipContent>Teaching and instruction language</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => {
				const lang = row.original.language;
				const label = Languages[lang as keyof typeof Languages] ?? lang;
				return <Badge variant="outline">{label}</Badge>;
			},
		}),
		columnHelper.display({
			id: "period",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
						Duration
					</TooltipTrigger>
					<TooltipContent>Class duration in minutes</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => {
				const period = row.original.period;
				if (!period) return "—";
				return `${period} mins`;
			},
		}),
		columnHelper.accessor("createdAt", {
			header: "Created",
			cell: ({ getValue }) => (
				<span className="text-muted-foreground text-xs">
					{getRelateTime(new Date(getValue()))} ago
				</span>
			),
		}),
		columnHelper.display({
			id: "edit",
			header: "Edit",
			cell: ({ row }) => (
				<Drawer>
					<DrawerTrigger
						nativeButton={false}
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
											{header.isPlaceholder ? null : (
												<table.FlexRender header={header} />
											)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.length ? (
								table.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												<table.FlexRender cell={cell} />
											</TableCell>
										))}
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={columns.length} className="text-center">
										No lessons found
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
