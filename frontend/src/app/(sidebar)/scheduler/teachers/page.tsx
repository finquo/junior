"use client";

import { useQuery } from "@tanstack/react-query";
import {
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
	type ColumnDef,
} from "@tanstack/react-table";
import { CalendarIcon, PenIcon } from "lucide-react";
import { getRelateTime } from "utils";
import { Languages } from "backend/config";
import Loader from "@/components/loader";
import { ProfileCard, TeacherProfile } from "@/components/profile";
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
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/hooks/api";
import { FetchUser } from "@/hooks/user";

type TeacherRecord = NonNullable<
	Awaited<
		ReturnType<
			NonNullable<
				ReturnType<typeof api.scheduler.getTeachers.queryOptions>["queryFn"]
			>
		>
	>
>[number];

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

const columnHelper = createColumnHelper<DataTableFeatures, TeacherRecord>();

const columns: ColumnDef<DataTableFeatures, TeacherRecord>[] =
	columnHelper.columns([
		columnHelper.display({
			id: "teacher",
			header: "Teacher",
			cell: ({ row }) => {
				const user = row.original.user;
				return (
					<Drawer>
						<DrawerTrigger
							render={
								<Item className="cursor-pointer p-0 text-left hover:opacity-80 transition-opacity" />
							}
						>
							<ItemMedia>
								<Avatar size="sm">
									<AvatarImage
										src={user?.image ?? undefined}
										alt={user?.name ?? "Teacher"}
									/>
									<AvatarFallback>
										{user?.name?.[0] ?? "T"}
									</AvatarFallback>
								</Avatar>
							</ItemMedia>
							<ItemContent>
								<ItemTitle>{user?.name ?? "Teacher"}</ItemTitle>
								<ItemDescription>{user?.email ?? "—"}</ItemDescription>
							</ItemContent>
						</DrawerTrigger>
						<DrawerContent className="overflow-y-auto">
							<DrawerHeader>
								<DrawerTitle>{user?.name ?? "Teacher"}</DrawerTitle>
								<DrawerDescription>{user?.email ?? "—"}</DrawerDescription>
							</DrawerHeader>
							<div className="flex flex-col gap-4 p-4">
								{user && <ProfileCard user={user} />}
								<TeacherProfile teacher={row.original} />
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
			id: "languages",
			header: "Languages",
			cell: ({ row }) =>
				row.original.languages
					?.map((code) => Languages[code as keyof typeof Languages] ?? code)
					.join(", ") || "—",
		}),
		columnHelper.display({
			id: "experience",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
						Experience
					</TooltipTrigger>
					<TooltipContent>
						Prior teaching background and employment history
					</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => {
				const latest = row.original.experiences?.[0];
				if (!latest) return "—";
				return latest.organization
					? `${latest.title} at ${latest.organization}`
					: latest.title;
			},
		}),
		columnHelper.display({
			id: "supervisor",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
						Supervisor
					</TooltipTrigger>
					<TooltipContent>
						Assigned scheduler supervisor
					</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => {
				const supervisorId = row.original.supervisorId;
				if (!supervisorId) {
					return <Badge variant="outline">Not Assigned</Badge>;
				}
				return (
					<HoverCard>
						<HoverCardTrigger
							render={
								<span
									role="button"
									className="cursor-pointer font-medium text-xs underline decoration-dotted"
								/>
							}
						>
							<FetchUser id={supervisorId} isPending={<Spinner />}>
								{(supervisor) => supervisor.name}
							</FetchUser>
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
											<ItemDescription>
												{supervisor.email}
											</ItemDescription>
										</ItemContent>
									</Item>
								)}
							</FetchUser>
						</HoverCardContent>
					</HoverCard>
				);
			},
		}),
		columnHelper.display({
			id: "availability",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
						Availability
					</TooltipTrigger>
					<TooltipContent>
						Teacher's weekly schedule availability and working hours
					</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => (
				<Drawer>
					<DrawerTrigger
						render={
							<Button variant="outline" size="icon-sm">
								<CalendarIcon />
							</Button>
						}
					/>
					<DrawerContent className="overflow-y-auto">
						<DrawerHeader>
							<DrawerTitle>Teacher Availability</DrawerTitle>
							<DrawerDescription>
								Availability schedule for {row.original.user?.name ?? "Teacher"}
							</DrawerDescription>
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
		columnHelper.accessor("createdAt", {
			header: "Joined",
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
							<DrawerTitle>Edit Teacher</DrawerTitle>
							<DrawerDescription>
								Edit teacher details
							</DrawerDescription>
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
	const { data: teachers = [], isPending } = useQuery(
		api.scheduler.getTeachers.queryOptions(),
	);

	const table = useTable({
		features,
		data: teachers,
		columns,
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<TooltipProvider>
			<Frame>
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
									<TableCell
										colSpan={columns.length}
										className="text-center"
									>
										No teachers found
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
