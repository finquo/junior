"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import {
	ExternalLinkIcon,
	MoreHorizontalIcon,
	PenIcon,
	PlusIcon,
} from "lucide-react";
import Link from "next/link";
import {
	getDurationFromInterval,
	getLanguageName,
	getRelateTime,
	Languages,
} from "utils";
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
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";

type LessonRecord = API_Returns["core"]["lesson"]["list"][number];

const languageOptions = Object.entries(Languages).map(([value, label]) => ({
	label,
	value,
}));

function LessonActions({ lesson }: { lesson: LessonRecord }) {
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
							<Link href="/" as={`/lessons/${lesson.id}`}>
								<ExternalLinkIcon />
								View Lesson Page
							</Link>
						</Button>
					</DropdownMenuItem>
					<DrawerTrigger asChild>
						<DropdownMenuItem>
							<PenIcon />
							Edit Lesson
						</DropdownMenuItem>
					</DrawerTrigger>
				</DropdownMenuContent>
			</DropdownMenu>

			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Edit Lesson</DrawerTitle>
					<DrawerDescription>Edit details for {lesson.name}</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="font-medium">Lesson ID</TableCell>
								<TableCell>
									<Button variant="link" asChild>
										<Link href="/" as={`/lessons/${lesson.id}`}>
											{lesson.id}
										</Link>
									</Button>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">Language</TableCell>
								<TableCell>
									<Badge variant="secondary">
										{getLanguageName(lesson.language)}
									</Badge>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</DrawerInner>
				<DrawerFooter>
					<CopyButton
						text={() => lesson.id}
						label="Lesson ID"
						variant="outline"
					/>
					<Button asChild>
						<Link href="/" as={`/lessons/${lesson.id}`}>
							Open Full Page
						</Link>
					</Button>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

const columnHelper = createColumnHelper<DataTableFeatures, LessonRecord>();

const columns: ColumnDef<DataTableFeatures, LessonRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("name", {
			id: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Lesson" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Lesson",
				placeholder: "Search lessons...",
				variant: "text",
			},
			cell: ({ row }) => {
				const lesson = row.original;
				return (
					<Drawer>
						<DrawerTrigger asChild>
							<Item>
								<ItemContent>
									<ItemTitle>{lesson.name}</ItemTitle>
									{lesson.description && (
										<ItemDescription>{lesson.description}</ItemDescription>
									)}
								</ItemContent>
							</Item>
						</DrawerTrigger>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>{lesson.name}</DrawerTitle>
								{lesson.description && (
									<DrawerDescription>{lesson.description}</DrawerDescription>
								)}
							</DrawerHeader>
							<DrawerInner>
								<Table>
									<TableBody>
										<TableRow>
											<TableCell className="font-medium">Lesson ID</TableCell>
											<TableCell>
												<Button variant="link" asChild>
													<Link href="/" as={`/lessons/${lesson.id}`}>
														{lesson.id}
													</Link>
												</Button>
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell className="font-medium">Language</TableCell>
											<TableCell>
												<Badge variant="secondary">
													{getLanguageName(lesson.language)}
												</Badge>
											</TableCell>
										</TableRow>
										{lesson.period && (
											<TableRow>
												<TableCell className="font-medium">Duration</TableCell>
												<TableCell>
													{getDurationFromInterval(lesson.period)} mins
												</TableCell>
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
							</DrawerInner>
							<DrawerFooter>
								<CopyButton
									text={() => lesson.id}
									label="Lesson ID"
									variant="outline"
								/>
								<Button asChild>
									<Link href="/" as={`/lessons/${lesson.id}`}>
										Open Page
									</Link>
								</Button>
								<DrawerClose asChild>
									<Button variant="outline">Close</Button>
								</DrawerClose>
							</DrawerFooter>
						</DrawerContent>
					</Drawer>
				);
			},
		}),
		columnHelper.accessor("id", {
			id: "id",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Lesson ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				if (!id) return null;
				return (
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href="/" as={`/lessons/${id}`}>
								{id}
							</Link>
						</Button>
						<CopyButton
							text={() => id}
							label="Lesson ID"
							variant="ghost"
							size="icon-sm"
						/>
					</ButtonGroup>
				);
			},
		}),
		columnHelper.accessor("language", {
			id: "language",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Language" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Language",
				variant: "multiSelect",
				options: languageOptions,
			},
			cell: ({ getValue }) => {
				const code = getValue();
				if (!code) return null;
				return <Badge variant="outline">{getLanguageName(code)}</Badge>;
			},
		}),
		columnHelper.accessor("period", {
			id: "period",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Duration" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Duration",
				variant: "number",
				unit: "mins",
			},
			cell: ({ getValue }) => {
				const val = getValue();
				return val ? `${getDurationFromInterval(val)} mins` : null;
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
			cell: ({ row }) => <LessonActions lesson={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.core.lesson.list.queryOptions(),
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
				<FrameTitle>Lessons</FrameTitle>
				<FrameDescription>
					Manage curriculum and course lessons
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button asChild>
							<Link href="/lessons/new">
								<PlusIcon />
								Create Lesson
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
