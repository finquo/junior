"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { Languages } from "backend/config";
import {
	CalendarIcon,
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
import { ProfileCard, TeacherProfile } from "@/components/profile";
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
import { UserEditDrawer } from "@/components/user-edit-drawer";
import { api } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import { useDataTable } from "@/hooks/use-data-table";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { EditTeacherDrawer } from "./_components/edit-drawer";

type TeacherRecord = API_Returns["core"]["teacher"]["list"][number];

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

function TeacherActions({ teacher }: { teacher: TeacherRecord }) {
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
						<Link href={`/teachers/${teacher.id}` as "/"}>
							<ExternalLinkIcon />
							View Profile
						</Link>
					</Button>
				</DropdownMenuItem>
				<EditTeacherDrawer teacher={teacher}>
					<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
						<PenIcon />
						Edit Teacher
					</DropdownMenuItem>
				</EditTeacherDrawer>
				<RenderWhenRole role="admin">
					<UserEditDrawer userId={teacher.id} userData={teacher.user}>
						<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
							<PenIcon />
							Edit User
						</DropdownMenuItem>
					</UserEditDrawer>
				</RenderWhenRole>
				{teacher.supervisorId && (
					<DropdownMenuItem asChild>
						<Button variant="link" asChild>
							<Link href={`/schedulers/${teacher.supervisorId}` as "/"}>
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

const columnHelper = createColumnHelper<DataTableFeatures, TeacherRecord>();

const columns: ColumnDef<DataTableFeatures, TeacherRecord>[] =
	columnHelper.columns([
		columnHelper.accessor((row) => row.user?.name, {
			id: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Teacher" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Teacher",
				placeholder: "Search teachers...",
				variant: "text",
			},
			cell: ({ row }) => {
				const user = row.original.user;
				return (
					<Drawer>
						<DrawerTrigger asChild>
							<Item>
								<ItemMedia>
									<Avatar size="sm">
										<AvatarImage
											src={user?.image ?? undefined}
											alt={user?.name ?? "Teacher"}
										/>
										<AvatarFallback>{user?.name?.[0] ?? "T"}</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{user?.name ?? "Teacher"}</ItemTitle>
									{user?.email && (
										<ItemDescription>{user.email}</ItemDescription>
									)}
								</ItemContent>
							</Item>
						</DrawerTrigger>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>{user?.name ?? "Teacher"}</DrawerTitle>
								{user?.email && (
									<DrawerDescription>{user.email}</DrawerDescription>
								)}
							</DrawerHeader>
							<DrawerInner>
								{user && <ProfileCard user={user} />}
								<TeacherProfile teacher={row.original} />
							</DrawerInner>
							<DrawerFooter>
								<CopyButton
									text={() => row.original.id}
									label="Teacher ID"
									variant="outline"
								/>
								<Button asChild>
									<Link href={`/teachers/${row.original.id}` as "/"}>
										View Full Profile
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
				<DataTableColumnHeader column={column} label="Teacher ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				if (!id) return null;
				return (
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href={`/teachers/${id}` as "/"}>{id}</Link>
						</Button>
						<CopyButton
							text={() => id}
							label="Teacher ID"
							variant="ghost"
							size="icon-sm"
						/>
					</ButtonGroup>
				);
			},
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
			id: "experience",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Experience</TooltipTrigger>
					<TooltipContent>
						Prior teaching background and employment history
					</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => {
				const latest = row.original.experiences?.[0];
				if (!latest) return null;
				return latest.organization
					? `${latest.title} at ${latest.organization}`
					: latest.title;
			},
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
		columnHelper.display({
			id: "availability",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Availability</TooltipTrigger>
					<TooltipContent>
						Teacher's weekly schedule availability and working hours
					</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => (
				<Drawer>
					<DrawerTrigger asChild>
						<Button variant="outline" size="icon-sm">
							<CalendarIcon />
						</Button>
					</DrawerTrigger>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Teacher Availability</DrawerTitle>
							<DrawerDescription>
								Availability schedule for {row.original.user?.name ?? "Teacher"}
							</DrawerDescription>
						</DrawerHeader>
						<DrawerInner />
						<DrawerFooter>
							<DrawerClose asChild>
								<Button variant="outline">Close</Button>
							</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			),
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
			header: () => null,
			size: 44,
			enableSorting: false,
			enableHiding: false,
			meta: { align: "right" },
			cell: ({ row }) => <TeacherActions teacher={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.core.teacher.list.queryOptions(),
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
				<FrameTitle>Teachers</FrameTitle>
				<FrameDescription>
					Manage teaching faculty, credentials, and availability
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
								Add Teacher
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
