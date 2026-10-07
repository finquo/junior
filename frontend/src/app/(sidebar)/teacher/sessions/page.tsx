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
import { PenIcon } from "lucide-react";
import { getRelateTime } from "utils";
import Loader from "@/components/loader";
import { ProfileCard } from "@/components/profile";
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
import { snakeToTitleCase } from "@/lib/utils";

type SlotRecord = NonNullable<
	Awaited<
		ReturnType<
			NonNullable<
				ReturnType<typeof api.teacher.getSlots.queryOptions>["queryFn"]
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

const columnHelper = createColumnHelper<DataTableFeatures, SlotRecord>();

const columns: ColumnDef<DataTableFeatures, SlotRecord>[] =
	columnHelper.columns([
		columnHelper.display({
			id: "student",
			header: "Student",
			cell: ({ row }) => {
				const studentId = row.original.studentId;
				if (!studentId) {
					return <Badge variant="outline">Not Assigned</Badge>;
				}
				return (
					<FetchUser id={studentId} isPending={<Spinner />}>
						{(user) => (
							<Drawer>
								<DrawerTrigger
									render={
										<Item className="cursor-pointer p-0 text-left transition-opacity hover:opacity-80" />
									}
								>
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
								</DrawerTrigger>
								<DrawerContent className="overflow-y-auto">
									<DrawerHeader>
										<DrawerTitle>{user.name}</DrawerTitle>
										<DrawerDescription>{user.email}</DrawerDescription>
									</DrawerHeader>
									<div className="flex flex-col gap-4 p-4">
										<ProfileCard user={user} />
									</div>
									<DrawerFooter>
										<DrawerClose render={<Button variant="outline" />}>
											Close
										</DrawerClose>
									</DrawerFooter>
								</DrawerContent>
							</Drawer>
						)}
					</FetchUser>
				);
			},
		}),
		columnHelper.accessor("status", {
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Status</TooltipTrigger>
					<TooltipContent>
						Lifecycle state of the scheduled session
					</TooltipContent>
				</Tooltip>
			),
			cell: ({ getValue }) => {
				const status = getValue();
				const variantMap: Record<
					string,
					"info" | "success" | "warning" | "destructive" | "secondary"
				> = {
					scheduled: "info",
					started: "success",
					rescheduled: "warning",
					request_reschedule: "destructive",
					attended: "secondary",
				};
				return (
					<Badge variant={variantMap[status] ?? "secondary"}>
						{snakeToTitleCase(status)}
					</Badge>
				);
			},
		}),
		columnHelper.accessor("startTime", {
			header: "Date",
			cell: ({ getValue }) => new Date(getValue()).toLocaleDateString(),
		}),
		columnHelper.display({
			id: "time",
			header: "Time",
			cell: ({ row }) => {
				const start = new Date(row.original.startTime);
				const end = new Date(row.original.expectedEndTime);
				return `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
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
						nativeButton={false}
						render={<a href={link} target="_blank" rel="noreferrer" />}
					>
						Join
					</Button>
				);
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
							<DrawerTitle>Edit Session</DrawerTitle>
							<DrawerDescription>
								Edit slot and reschedule details
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
	const { data: slots = [], isPending } = useQuery(
		api.teacher.getSlots.queryOptions(),
	);

	const table = useTable({
		features,
		data: slots,
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
									<TableCell colSpan={columns.length} className="text-center">
										No sessions found
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
