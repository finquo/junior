"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
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
import { Spinner } from "@/components/ui/spinner";
import { UserEditDrawer } from "@/components/user-edit-drawer";
import { api } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";

type SchedulerRecord = API_Returns["core"]["scheduler"]["list"][number];

function SchedulerActions({ scheduler }: { scheduler: SchedulerRecord }) {
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
							<Link href={`/schedulers/${scheduler.id}` as "/"}>
								<ExternalLinkIcon />
								View Profile
							</Link>
						</Button>
					</DropdownMenuItem>
					<DrawerTrigger asChild>
						<DropdownMenuItem>
							<UserIcon />
							Quick Preview
						</DropdownMenuItem>
					</DrawerTrigger>
					<RenderWhenRole role="admin">
						<UserEditDrawer userId={scheduler.id} userData={scheduler.user}>
							<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
								<PenIcon />
								Edit User
							</DropdownMenuItem>
						</UserEditDrawer>
					</RenderWhenRole>
				</DropdownMenuContent>
			</DropdownMenu>

			<DrawerContent>
				<DrawerHeader>
					<DrawerTitle>
						{scheduler.user?.name ?? "Scheduler Profile"}
					</DrawerTitle>
					{scheduler.user?.email && (
						<DrawerDescription>{scheduler.user.email}</DrawerDescription>
					)}
				</DrawerHeader>
				<DrawerInner>
					{scheduler.user && <ProfileCard user={scheduler.user} />}
				</DrawerInner>
				<DrawerFooter>
					<CopyButton
						text={() => scheduler.id}
						label="Scheduler ID"
						variant="outline"
					/>
					<Button asChild>
						<Link href={`/schedulers/${scheduler.id}` as "/"}>
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
}

const columnHelper = createColumnHelper<DataTableFeatures, SchedulerRecord>();

const columns: ColumnDef<DataTableFeatures, SchedulerRecord>[] =
	columnHelper.columns([
		columnHelper.accessor((row) => row.user?.name, {
			id: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Scheduler" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Scheduler",
				placeholder: "Search schedulers...",
				variant: "text",
			},
			cell: ({ row }) => {
				const scheduler = row.original;
				const user = scheduler.user;
				return (
					<Drawer>
						<DrawerTrigger asChild>
							<Item>
								<ItemMedia>
									<Avatar size="sm">
										<AvatarImage
											src={user?.image ?? undefined}
											alt={user?.name ?? "Scheduler"}
										/>
										<AvatarFallback>{user?.name?.[0] ?? "S"}</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{user?.name ?? "Scheduler"}</ItemTitle>
									{user?.email && (
										<ItemDescription>{user.email}</ItemDescription>
									)}
								</ItemContent>
							</Item>
						</DrawerTrigger>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>{user?.name ?? "Scheduler Profile"}</DrawerTitle>
								{user?.email && (
									<DrawerDescription>{user.email}</DrawerDescription>
								)}
							</DrawerHeader>
							<DrawerInner>{user && <ProfileCard user={user} />}</DrawerInner>
							<DrawerFooter>
								<CopyButton
									text={() => scheduler.id}
									label="Scheduler ID"
									variant="outline"
								/>
								<Button asChild>
									<Link href={`/schedulers/${scheduler.id}` as "/"}>
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
				<DataTableColumnHeader column={column} label="Scheduler ID" />
			),
			enableSorting: true,
			cell: ({ getValue }) => {
				const id = getValue();
				if (!id) return null;
				return (
					<ButtonGroup>
						<Button variant="link" asChild>
							<Link href={`/schedulers/${id}` as "/"}>{id}</Link>
						</Button>
						<CopyButton
							text={() => id}
							label="Scheduler ID"
							variant="ghost"
							size="icon-sm"
						/>
					</ButtonGroup>
				);
			},
		}),
		columnHelper.accessor((row) => row.user?.email, {
			id: "email",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Email" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Email",
				placeholder: "Search email...",
				variant: "text",
			},
			cell: ({ getValue }) => getValue() ?? null,
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
			cell: ({ row }) => <SchedulerActions scheduler={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.core.scheduler.list.queryOptions(),
	);

	const { table } = useDataTable({
		data,
		columns,
		mode: "client",
		initialState: {
			sorting: [{ id: "createdAt", desc: true }],
			pagination: { pageIndex: 0, pageSize: 10 },
			columnVisibility: { id: false, email: false },
		},
		getRowId: (row) => row.id,
	});

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Schedulers</FrameTitle>
				<FrameDescription>
					Manage scheduling team members and assignments
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
								Add Scheduler
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
