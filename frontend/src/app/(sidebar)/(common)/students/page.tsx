"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Languages } from "backend/config";
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
import { ProfileCard, StudentProfile } from "@/components/profile";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/hooks/api";
import { useDataTable } from "@/hooks/use-data-table";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { EditStudentDrawer } from "./_components/edit-drawer";

type StudentRecord = API_Returns["core"]["student"]["list"][number];

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

function UserInlineSkeleton() {
	return <Skeleton className="h-4 w-20" />;
}

function StudentActions({ student }: { student: StudentRecord }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon-sm">
					<MoreHorizontalIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem asChild>
					<Button variant="link" asChild>
						<Link href={`/students/${student.id}` as "/"}>
							<ExternalLinkIcon />
							View Profile
						</Link>
					</Button>
				</DropdownMenuItem>
				<EditStudentDrawer student={student}>
					<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
						<PenIcon />
						Edit Student
					</DropdownMenuItem>
				</EditStudentDrawer>
				{student.supervisorId && (
					<DropdownMenuItem asChild>
						<Button variant="link" asChild>
							<Link href={`/schedulers/${student.supervisorId}` as "/"}>
								<UserIcon />
								View Supervisor
							</Link>
						</Button>
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const columnHelper = createColumnHelper<DataTableFeatures, StudentRecord>();

const columns: ColumnDef<DataTableFeatures, StudentRecord>[] =
	columnHelper.columns([
		columnHelper.display({
			id: "student",
			header: "Student",
			cell: ({ row }) => (
				<FetchUser id={row.original.id} isPending={<UserCellSkeleton />}>
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
									<StudentProfile student={row.original} />
								</DrawerInner>
								<DrawerFooter>
									<CopyButton
										text={() => row.original.id}
										label="Student ID"
										variant="outline"
									/>
									<Button asChild>
										<Link href={`/students/${row.original.id}` as "/"}>
											View Full Profile
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
			),
		}),
		columnHelper.accessor("id", {
			id: "id",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Student ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				if (!id) return null;
				return (
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href={`/students/${id}` as "/"}>{id}</Link>
						</Button>
						<CopyButton
							text={() => id}
							label="Student ID"
							variant="ghost"
							size="icon-sm"
						/>
					</ButtonGroup>
				);
			},
		}),
		columnHelper.accessor("program", {
			id: "program",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Program" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Program",
				placeholder: "Search program...",
				variant: "text",
			},
			cell: ({ getValue }) => getValue() ?? null,
		}),
		columnHelper.accessor("schooling", {
			id: "schooling",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Schooling" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Schooling",
				placeholder: "Search schooling...",
				variant: "text",
			},
			cell: ({ getValue }) => getValue() ?? null,
		}),
		columnHelper.display({
			id: "languages",
			header: "Languages",
			cell: ({ row }) => {
				const langs = row.original.languages;
				if (!langs?.length) return null;
				return langs
					.map((code) => Languages[code as keyof typeof Languages] ?? code)
					.join(", ");
			},
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
							<Button variant="link" asChild>
								<Link href={`/schedulers/${supervisorId}` as "/"}>
									<FetchUser
										id={supervisorId}
										isPending={<UserInlineSkeleton />}
									>
										{(supervisor) => supervisor.name}
									</FetchUser>
								</Link>
							</Button>
						</HoverCardTrigger>
						<HoverCardContent className="w-64">
							<FetchUser id={supervisorId} isPending={<UserCellSkeleton />}>
								{(supervisor) => (
									<Item>
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
				<DataTableColumnHeader column={column} label="Joined" />
			),
			enableSorting: true,
			cell: ({ getValue }) => `${getRelateTime(new Date(getValue()))} ago`,
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			enableSorting: false,
			enableHiding: false,
			cell: ({ row }) => <StudentActions student={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(api.core.student.list.queryOptions());

	const { table } = useDataTable({
		data,
		columns,
		mode: "client",
		initialState: {
			sorting: [{ id: "createdAt", desc: true }],
			pagination: { pageIndex: 0, pageSize: 10 },
		},
		getRowId: (row) => row.id,
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Students</FrameTitle>
				<FrameDescription>
					Manage student profiles and enrollment
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button asChild>
						<Link href="/admin/users/new">
							<PlusIcon />
							Add Student
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
