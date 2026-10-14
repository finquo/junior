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
import type { StudentType } from "backend/db";
import { PenIcon } from "lucide-react";
import { getRelateTime } from "utils";
import Loader from "@/components/loader";
import { ProfileCard, StudentProfile } from "@/components/profile";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
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
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/hooks/api";
import { FetchUser } from "@/hooks/user";
import { EditStudentDrawer } from "./_components/edit-drawer";

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

const columnHelper = createColumnHelper<DataTableFeatures, StudentType>();

const columns: ColumnDef<DataTableFeatures, StudentType>[] =
	columnHelper.columns([
		columnHelper.display({
			id: "student",
			header: "Student",
			cell: ({ row }) => (
				<FetchUser id={row.original.id} isPending={<Spinner />}>
					{(user) => (
						<Drawer>
							<DrawerTrigger asChild>
								<Item className="cursor-pointer p-0 text-left transition-opacity hover:opacity-80">
								<ItemMedia>
									<Avatar size="sm">
										<AvatarImage
											src={user.image ?? undefined}
											alt={user.name}
										/>
										<AvatarFallback>{user.name?.[0] ?? "U"}</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{user.name}</ItemTitle>
									<ItemDescription>{user.email}</ItemDescription>
								</ItemContent>
							</Item>
						</DrawerTrigger>
							<DrawerContent className="overflow-y-auto">
								<DrawerHeader>
									<DrawerTitle>{user.name}</DrawerTitle>
									<DrawerDescription>{user.email}</DrawerDescription>
								</DrawerHeader>
								<div className="flex flex-col gap-4 p-4">
									<ProfileCard user={user} />
									<StudentProfile student={row.original} />
								</div>
								<DrawerFooter>
									<DrawerClose asChild>
									<Button variant="outline">Close</Button>
								</DrawerClose>
								</DrawerFooter>
							</DrawerContent>
						</Drawer>
					)}
				</FetchUser>
			),
		}),
		columnHelper.accessor("program", {
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Program</TooltipTrigger>
					<TooltipContent>Enrolled study track or course plan</TooltipContent>
				</Tooltip>
			),
			cell: ({ getValue }) => getValue() ?? "—",
		}),
		columnHelper.accessor("schooling", {
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Schooling</TooltipTrigger>
					<TooltipContent>Student's affiliated curriculum board</TooltipContent>
				</Tooltip>
			),
			cell: ({ getValue }) => getValue() ?? "—",
		}),
		columnHelper.display({
			id: "languages",
			header: "Languages",
			cell: ({ row }) =>
				row.original.languages
					?.map((code) => Languages[code as keyof typeof Languages] ?? code)
					.join(", ") || "—",
		}),
		columnHelper.display({
			id: "lessons",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Lessons</TooltipTrigger>
					<TooltipContent>Total enrolled lesson sessions</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => row.original.lessons?.length ?? 0,
		}),
		columnHelper.display({
			id: "supervisor",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Supervisor</TooltipTrigger>
					<TooltipContent>Assigned scheduler supervisor</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => {
				const supervisorId = row.original.supervisorId;
				if (!supervisorId) {
					return <Badge variant="outline">Not Assigned</Badge>;
				}
				return (
					<HoverCard>
						<HoverCardTrigger asChild>
							<span
								role="button"
								className="cursor-pointer font-medium text-xs underline decoration-dotted"
							>
								<FetchUser id={supervisorId} isPending={<Spinner />}>
								{(supervisor) => supervisor.name}
							</FetchUser>
							</span>
						</HoverCardTrigger>
						<HoverCardContent className="w-64">
							<FetchUser id={supervisorId} isPending={<Spinner />}>
								{(supervisor) => (
									<Item className="p-0 text-left">
										<ItemMedia>
											<Avatar size="sm">
												<AvatarImage
													src={supervisor.image ?? undefined}
													alt={supervisor.name}
												/>
												<AvatarFallback>
													{supervisor.name?.[0] ?? "S"}
												</AvatarFallback>
											</Avatar>
										</ItemMedia>
										<ItemContent>
											<ItemTitle>{supervisor.name}</ItemTitle>
											<ItemDescription>{supervisor.email}</ItemDescription>
										</ItemContent>
									</Item>
								)}
							</FetchUser>
						</HoverCardContent>
					</HoverCard>
				);
			},
		}),
		columnHelper.accessor("meetingLink", {
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Meeting</TooltipTrigger>
					<TooltipContent>
						Direct video conference classroom link
					</TooltipContent>
				</Tooltip>
			),
			cell: ({ getValue }) => {
				const link = getValue();
				if (!link) return "—";
				return (
					<Button
						variant="outline"
						size="sm"
						asChild
					>
						<a href={link} target="_blank" rel="noreferrer">
							Join
						</a>
					</Button>
				);
			},
		}),
		columnHelper.accessor("createdAt", {
			header: "Joined",
			cell: ({ getValue }) => `${getRelateTime(new Date(getValue()))} ago`,
		}),
		columnHelper.display({
			id: "edit",
			header: "Edit",
			cell: ({ row }) => (
				<EditStudentDrawer student={row.original}>
					<Button variant="outline" size="icon-sm">
						<PenIcon />
					</Button>
				</EditStudentDrawer>
			),
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.core.student.list.queryOptions(),
	);

	const table = useTable({
		features,
		data,
		columns,
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<Frame>
			<FramePanel>
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
									No students found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</FramePanel>
		</Frame>
	);
}
