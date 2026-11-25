"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { langFlag, langName } from "language-emoji";
import {
	ExternalLinkIcon,
	MoreHorizontalIcon,
	PenIcon,
	PlusIcon,
	ScanEyeIcon,
} from "lucide-react";
import Link from "next/link";
import {
	Countries,
	type CountryCodes,
	getCountryCurrencySymbol,
	getCountryName,
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
import { useHasRole } from "@/hooks/role";
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";

type CourseRecord = API_Returns["core"]["course"]["list"][number];

function formatPrice(code: CountryCodes, amount: number) {
	return `${getCountryCurrencySymbol(code)}${amount.toLocaleString()}`;
}

function CourseDrawer({ course }: { course: CourseRecord }) {
	return (
		<DrawerContent>
			<DrawerHeader>
				<DrawerTitle>{course.name}</DrawerTitle>
				<DrawerDescription>{course.description}</DrawerDescription>
			</DrawerHeader>
			<DrawerInner>
				<Table>
					<TableBody>
						<TableRow>
							<TableCell className="font-medium">Course ID</TableCell>
							<TableCell>{course.id}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">Language</TableCell>
							<TableCell>
								{langFlag(course.language)} {langName(course.language)}
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">Modules</TableCell>
							<TableCell>{course.moduleCount}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">Videos</TableCell>
							<TableCell>{course.videoCount}</TableCell>
						</TableRow>
						{Object.entries(course.price ?? {}).map(([code, amount]) => (
							<TableRow key={code}>
								<TableCell className="font-medium">
									{getCountryName(code)}
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
					text={() => course.id}
					label="Course ID"
					variant="outline"
				/>
				<Button asChild>
					<Link href={`/courses/${course.id}` as "/"}>Open Course Page</Link>
				</Button>
				<DrawerClose asChild>
					<Button variant="outline">Close</Button>
				</DrawerClose>
			</DrawerFooter>
		</DrawerContent>
	);
}

function CourseActions({ course }: { course: CourseRecord }) {
	const canEdit = useHasRole("admin");

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
						<Link href={`/courses/${course.id}` as "/"}>
							<ExternalLinkIcon />
							View Course Page
						</Link>
					</DropdownMenuItem>
					{canEdit && (
						<DropdownMenuItem asChild>
							<Link href={`/courses/${course.id}/edit` as "/"}>
								<PenIcon />
								Edit Course
							</Link>
						</DropdownMenuItem>
					)}
					<DrawerTrigger asChild>
						<DropdownMenuActionItem>
							<ScanEyeIcon />
							Quick View
						</DropdownMenuActionItem>
					</DrawerTrigger>
				</DropdownMenuContent>
			</DropdownMenu>
			<CourseDrawer course={course} />
		</Drawer>
	);
}

const columnHelper = createColumnHelper<DataTableFeatures, CourseRecord>();

const priceColumns = (Object.keys(Countries) as CountryCodes[]).map((code) =>
	columnHelper.accessor((row) => row.price[code], {
		id: `price-${code}`,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label={`Price (${code})`} />
		),
		enableSorting: true,
		cell: ({ getValue }) => formatPrice(code, getValue() ?? 0),
	}),
);

const columns: ColumnDef<DataTableFeatures, CourseRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("name", {
			id: "name",
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
				const course = row.original;
				return (
					<Button variant="link" asChild className="h-auto p-0">
						<Link href={`/courses/${course.id}` as "/"}>
							<Item>
								<ItemContent>
									<ItemTitle>{course.name}</ItemTitle>
									<ItemDescription>{course.description}</ItemDescription>
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
				<DataTableColumnHeader column={column} label="Course ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				if (!id) return null;
				return (
					<Button variant="link" asChild>
						<Link href={`/courses/${id}` as "/"}>{id}</Link>
					</Button>
				);
			},
		}),
		columnHelper.accessor("language", {
			id: "language",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Language" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const language = getValue();
				if (!language) return null;
				return (
					<Badge variant="outline">
						{langFlag(language)} {langName(language)}
					</Badge>
				);
			},
		}),
		columnHelper.accessor("moduleCount", {
			id: "moduleCount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Modules" />
			),
			enableSorting: true,
			meta: { label: "Modules", variant: "number", unit: "modules" },
			cell: ({ getValue }) => <Badge>{getValue()}</Badge>,
		}),
		columnHelper.accessor("videoCount", {
			id: "videoCount",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Videos" />
			),
			enableSorting: true,
			meta: { label: "Videos", variant: "number", unit: "videos" },
			cell: ({ getValue }) => <Badge>{getValue()}</Badge>,
		}),
		...priceColumns,
		columnHelper.display({
			id: "actions",
			header: "Actions",
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => <CourseActions course={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.core.course.list.queryOptions(),
	);
	const canCreate = useHasRole("admin");

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
				<FrameTitle>Courses</FrameTitle>
				<FrameDescription>
					Explore courses, modules, and videos
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						{canCreate && (
							<Button asChild>
								<Link href="/courses/new">
									<PlusIcon />
									Create Course
								</Link>
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
