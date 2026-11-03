"use client";

import { useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { getRelateTime } from "utils";
import { CopyButton } from "@/components/copy";
import { UserActions } from "@/components/custom/user-actions";
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
import { ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
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
import { FieldGroup } from "@/components/ui/field";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/hooks/api";
import { useDataTable } from "@/hooks/use-data-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";
import { rolesObject } from "@/lib/role";
import { snakeToTitleCase } from "@/lib/utils";

type UserRecord = API_Returns["admin"]["getUsers"][number];

const roleFilterOptions = rolesObject.map((item) => ({
	label: item.label ?? item.value,
	value: item.value,
}));

const statusFilterOptions = [
	{ label: "Active", value: "active" },
	{ label: "Banned", value: "banned" },
];

const columnHelper = createColumnHelper<DataTableFeatures, UserRecord>();

const columns: ColumnDef<DataTableFeatures, UserRecord>[] =
	columnHelper.columns([
		columnHelper.accessor("name", {
			id: "name",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="User" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "User",
				placeholder: "Search name...",
				variant: "text",
			},
			cell: ({ row }) => {
				const member = row.original;
				const roleProfilePath =
					member.role === "teacher"
						? `/teachers/${member.id}`
						: member.role === "student"
							? `/students/${member.id}`
							: member.role === "scheduler"
								? `/schedulers/${member.id}`
								: null;

				return (
					<Drawer>
						<DrawerTrigger asChild>
							<Item>
								<ItemMedia>
									<Avatar size="sm">
										<AvatarImage
											src={member.image ?? undefined}
											alt={member.name}
										/>
										<AvatarFallback>{member.name?.[0] ?? "U"}</AvatarFallback>
									</Avatar>
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{member.name}</ItemTitle>
									{member.email && (
										<ItemDescription>{member.email}</ItemDescription>
									)}
									{member.phoneNumber && (
										<ItemDescription>{member.phoneNumber}</ItemDescription>
									)}
								</ItemContent>
							</Item>
						</DrawerTrigger>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>{member.name}</DrawerTitle>
								{member.email && (
									<DrawerDescription>{member.email}</DrawerDescription>
								)}
								{member.phoneNumber && (
									<DrawerDescription>{member.phoneNumber}</DrawerDescription>
								)}
							</DrawerHeader>
							<DrawerInner>
								<ProfileCard user={member} />
							</DrawerInner>
							<DrawerFooter>
								<CopyButton
									text={() => member.id}
									label="User ID"
									variant="outline"
								/>
								{roleProfilePath && (
									<Button asChild>
										<Link href={roleProfilePath as "/"}>
											View {snakeToTitleCase(member.role)} Profile
										</Link>
									</Button>
								)}
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
				<DataTableColumnHeader column={column} label="User ID" />
			),
			enableSorting: true,
			cell: ({ row, getValue }) => {
				const id = getValue();
				if (!id) return null;
				const role = row.original.role;
				const path =
					role === "teacher"
						? `/teachers/${id}`
						: role === "student"
							? `/students/${id}`
							: role === "scheduler"
								? `/schedulers/${id}`
								: null;

				return (
					<ButtonGroup>
						{path ? (
							<Button variant="link" asChild>
								<Link href={path as "/"}>{id}</Link>
							</Button>
						) : (
							<ButtonGroupText>{id}</ButtonGroupText>
						)}
						<CopyButton
							text={() => id}
							label="User ID"
							variant="ghost"
							size="icon-sm"
						/>
					</ButtonGroup>
				);
			},
		}),
		columnHelper.accessor("email", {
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
		columnHelper.accessor("role", {
			id: "role",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Role" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Role",
				variant: "multiSelect",
				options: roleFilterOptions,
			},
			cell: ({ getValue }) => {
				const role = getValue();
				return (
					<ColorBadge>{snakeToTitleCase(role) ?? "Not Assigned"}</ColorBadge>
				);
			},
		}),
		columnHelper.accessor((row) => (row.banned ? "banned" : "active"), {
			id: "status",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Status" />
			),
			enableColumnFilter: true,
			enableSorting: true,
			meta: {
				label: "Status",
				variant: "multiSelect",
				options: statusFilterOptions,
			},
			cell: ({ row }) => {
				const member = row.original;
				if (member.banned) {
					return (
						<Tooltip>
							<TooltipTrigger>
								<ColorBadge variant="destructive">Banned</ColorBadge>
							</TooltipTrigger>
							<TooltipContent>
								<FieldGroup>
									{member.banReason && <span>Reason: {member.banReason}</span>}
									<span>
										Expires:{" "}
										{member.banExpires
											? `${getRelateTime(new Date(member.banExpires))} ago`
											: "Never"}
									</span>
								</FieldGroup>
							</TooltipContent>
						</Tooltip>
					);
				}
				return <ColorBadge variant="success">Active</ColorBadge>;
			},
		}),
		columnHelper.accessor("createdAt", {
			id: "createdAt",
			header: ({ column }) => (
				<DataTableColumnHeader column={column} label="Joined" />
			),
			enableSorting: true,
			cell: ({ getValue }) => (
				<span className="text-muted-foreground text-xs">
					{getRelateTime(new Date(getValue()))} ago
				</span>
			),
		}),
		columnHelper.display({
			id: "actions",
			header: () => null,
			size: 44,
			enableSorting: false,
			enableHiding: false,
			meta: { align: "right" },
			cell: ({ row }) => <UserActions user={row.original} />,
		}),
	]);

export default function Page() {
	const { data = [], isPending } = useQuery(
		api.admin.getUsers.queryOptions({ input: {} }),
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
				<FrameTitle>Users Management</FrameTitle>
				<FrameDescription>
					Manage platform user accounts and role assignments
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isPending && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button asChild>
							<Link href="/users/new">
								<UserPlusIcon />
								Create User
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
