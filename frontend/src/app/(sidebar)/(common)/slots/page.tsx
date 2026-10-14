"use client";

import { useQuery } from "@tanstack/react-query";
import {
	type ColumnDef,
	createColumnHelper,
} from "@tanstack/react-table";
import {
	ExternalLinkIcon,
	MoreHorizontalIcon,
	PenIcon,
	PlusIcon,
	UserIcon,
} from "lucide-react";
import Link from "next/link";
import { getRelateTime } from "utils";
import { CopyButton } from "@/components/copy";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { ProfileCard } from "@/components/profile";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/hooks/api";
import { useDataTable } from "@/hooks/use-data-table";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { snakeToTitleCase } from "@/lib/utils";

type SlotRecord = API_Returns["core"]["slot"]["list"][number];

const statusOptions = [
	{ label: "Scheduled", value: "scheduled" },
	{ label: "Started", value: "started" },
	{ label: "Rescheduled", value: "rescheduled" },
	{ label: "Request Reschedule", value: "request_reschedule" },
	{ label: "Attended", value: "attended" },
];

function UserCellSkeleton() {
	return (
		<Item>
			<ItemMedia>
				<Skeleton className="size-8 rounded-full" />
			</ItemMedia>
			<ItemContent>
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-3 w-32" />
			</ItemContent>
		</Item>
	);
}

function SlotActions({ slot }: { slot: SlotRecord }) {
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
							<Link href="/" as={`/slots/${slot.id}`}>
								<ExternalLinkIcon />
								View Session
							</Link>
						</Button>
					</DropdownMenuItem>
					{slot.studentId && (
						<DropdownMenuItem asChild>
							<Button variant="link" asChild>
								<Link href="/" as={`/students/${slot.studentId}`}>
									<UserIcon />
									View Student
								</Link>
							</Button>
						</DropdownMenuItem>
					)}
					{slot.teacherId && (
						<DropdownMenuItem asChild>
							<Button variant="link" asChild>
								<Link href="/" as={`/teachers/${slot.teacherId}`}>
									<UserIcon />
									View Teacher
								</Link>
							</Button>
						</DropdownMenuItem>
					)}
					<DrawerTrigger asChild>
						<DropdownMenuItem>
							<PenIcon />
							Edit Session
						</DropdownMenuItem>
					</DrawerTrigger>
				</DropdownMenuContent>
			</DropdownMenu>

			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>Edit Session</DrawerTitle>
					<DrawerDescription>Session #{slot.id}</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="font-medium">Status</TableCell>
								<TableCell>
									<Badge variant="secondary">
										{snakeToTitleCase(slot.status)}
									</Badge>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">Date & Time</TableCell>
								<TableCell>{new Date(slot.startTime).toLocaleString()}</TableCell>
							</TableRow>
							{slot.meetingLink && (
								<TableRow>
									<TableCell className="font-medium">Meeting</TableCell>
									<TableCell>
										<Button variant="link" asChild>
											<a href={slot.meetingLink} target="_blank" rel="noreferrer">
												Join
											</a>
										</Button>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</DrawerInner>
				<DrawerFooter>
					<CopyButton
						text={() => slot.id}
						label="Session ID"
						variant="outline"
					/>
					<Button asChild>
						<Link href="/" as={`/slots/${slot.id}`}>Open Session Page</Link>
					</Button>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

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
					<FetchUser id={studentId} isPending={<UserCellSkeleton />}>
						{(user) => (
							<Drawer>
								<DrawerTrigger asChild>
									<Item>
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
								<DrawerContent>
									<DrawerHeader>
										<DrawerTitle>{user.name}</DrawerTitle>
										<DrawerDescription>{user.email}</DrawerDescription>
									</DrawerHeader>
									<DrawerInner>
										<ProfileCard user={user} />
									</DrawerInner>
									<DrawerFooter>
										<Button asChild>
											<Link href="/" as={`/students/${studentId}`}>
												View Student Profile
											</Link>
										</Button>
										<DrawerClose asChild>
											<Button variant="outline">Close</Button>
										</DrawerClose>
									</DrawerFooter>
								</DrawerContent>
							</Drawer>
						)}
					</FetchUser>
				);
			},
		}),
		columnHelper.display({
			id: "teacher",
			header: "Teacher",
			cell: ({ row }) => {
				const teacherId = row.original.teacherId;
				if (!teacherId) {
					return <Badge variant="outline">Not Assigned</Badge>;
				}
				return (
					<FetchUser id={teacherId} isPending={<UserCellSkeleton />}>
						{(user) => (
							<Drawer>
								<DrawerTrigger asChild>
									<Item>
										<ItemMedia>
											<Avatar size="sm">
												<AvatarImage
													src={user.image ?? undefined}
													alt={user.name}
												/>
												<AvatarFallback>{user.name?.[0] ?? "T"}</AvatarFallback>
											</Avatar>
										</ItemMedia>
										<ItemContent>
											<ItemTitle>{user.name}</ItemTitle>
											<ItemDescription>{user.email}</ItemDescription>
										</ItemContent>
									</Item>
								</DrawerTrigger>
								<DrawerContent>
									<DrawerHeader>
										<DrawerTitle>{user.name}</DrawerTitle>
										<DrawerDescription>{user.email}</DrawerDescription>
									</DrawerHeader>
									<DrawerInner>
										<ProfileCard user={user} />
									</DrawerInner>
									<DrawerFooter>
										<Button asChild>
											<Link href="/" as={`/teachers/${teacherId}`}>
												View Teacher Profile
											</Link>
										</Button>
										<DrawerClose asChild>
											<Button variant="outline">Close</Button>
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
			id: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Status" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Status",
				variant: "multiSelect",
				options: statusOptions,
			},
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
			id: "startTime",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Date" />
			),
			enableSorting: true,
			cell: ({ getValue }) =>
				new Date(getValue()).toLocaleDateString(),
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
			id: "meetingLink",
			header: "Meeting",
			cell: ({ getValue }) => {
				const link = getValue();
				if (!link) return null;
				return (
					<Button variant="link" asChild>
						<a href={link} target="_blank" rel="noreferrer">
							Join
						</a>
					</Button>
				);
			},
		}),
		columnHelper.accessor("createdAt", {
			id: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Created" />
			),
			enableSorting: true,
			cell: ({ getValue }) =>
				`${getRelateTime(new Date(getValue()))} ago`,
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => <SlotActions slot={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(api.core.slot.list.queryOptions());

	const { table } = useDataTable({
		data,
		columns,
		mode: "client",
		initialState: {
			sorting: [{ id: "startTime", desc: true }],
			pagination: { pageIndex: 0, pageSize: 10 },
		},
		getRowId: (row) => row.id,
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Sessions & Slots</FrameTitle>
				<FrameDescription>Manage scheduled calendar sessions</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button asChild>
							<Link href="/slots/new">
								<PlusIcon />
								Create Session
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
