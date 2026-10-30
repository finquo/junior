"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import {
	ExternalLinkIcon,
	MoreHorizontalIcon,
	PenIcon,
	TrashIcon,
	UserIcon,
	UserPlusIcon,
	UserXIcon,
} from "lucide-react";
import Link from "next/link";
import { sileo as toast } from "sileo";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { ImpersonateButton } from "@/hooks/admin";
import { api, queryClient } from "@/hooks/api";
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

function EditRoleDrawerContent({ user }: { user: UserRecord }) {
	const { mutateAsync, isPending } = useMutation(
		api.admin.promote.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success({ title: "Role updated successfully" });
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			role: user.role ?? "user",
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				id: user.id,
				role: value.role,
			});
		},
	});

	return (
		<DrawerContent>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<DrawerHeader>
					<DrawerTitle>Edit User Role</DrawerTitle>
					<DrawerDescription>
						Promote or reassign role for {user.name} ({user.email})
					</DrawerDescription>
				</DrawerHeader>
				<DrawerInner>
					<FieldGroup>
						<form.Field
							name="role"
							children={(field) => (
								<Field>
									<FieldLabel>Role</FieldLabel>
									<Select
										items={rolesObject}
										value={field.state.value}
										disabled={isPending}
										onValueChange={(r) => {
											if (r) field.handleChange(r);
										}}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select role" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{rolesObject.map((item) => (
													<SelectItem key={item.value} value={item.value}>
														{item.label}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								</Field>
							)}
						/>
					</FieldGroup>
				</DrawerInner>
				<DrawerFooter>
					<Button type="submit" disabled={isPending}>
						{isPending && <Spinner />}
						Submit
					</Button>
					<DrawerClose asChild>
						<Button variant="outline">Close</Button>
					</DrawerClose>
				</DrawerFooter>
			</form>
		</DrawerContent>
	);
}

function UserActions({ user }: { user: UserRecord }) {
	const roleProfilePath =
		user.role === "teacher"
			? `/teachers/${user.id}`
			: user.role === "student"
				? `/students/${user.id}`
				: user.role === "scheduler"
					? `/schedulers/${user.id}`
					: null;

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
						<ImpersonateButton userId={user.id} asChild>
							<Button variant="outline" size="sm">
								<ExternalLinkIcon />
								Impersonate
							</Button>
						</ImpersonateButton>
					</DropdownMenuItem>
					<DrawerTrigger asChild>
						<DropdownMenuItem>
							<PenIcon />
							Edit Role
						</DropdownMenuItem>
					</DrawerTrigger>
					{roleProfilePath && (
						<DropdownMenuItem asChild>
							<Button variant="link" asChild>
								<Link href={roleProfilePath as "/"}>
									<UserIcon />
									View {snakeToTitleCase(user.role)} Profile
								</Link>
							</Button>
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						onClick={() => {
							toast.info({
								title: `Revoked active sessions for ${user.name}`,
							});
						}}
					>
						<UserXIcon />
						Revoke Sessions
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant="destructive"
						onClick={() => {
							toast.error({
								title: `Delete action requested for ${user.name}`,
								description: "This is a placeholder action.",
							});
						}}
					>
						<TrashIcon />
						Delete User
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<EditRoleDrawerContent user={user} />
		</Drawer>
	);
}

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
								</ItemContent>
							</Item>
						</DrawerTrigger>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>{member.name}</DrawerTitle>
								{member.email && (
									<DrawerDescription>{member.email}</DrawerDescription>
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
							<Link href="/admin/users/new">
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
