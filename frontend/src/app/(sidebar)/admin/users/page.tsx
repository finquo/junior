"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { useDebounce } from "@uidotdev/usehooks";
import {
	ExternalLinkIcon,
	MoreHorizontalIcon,
	PenIcon,
	Search,
	TrashIcon,
	UserPlusIcon,
	UserXIcon,
} from "lucide-react";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { sileo as toast } from "sileo";
import { getRelateTime } from "utils";
import Loader from "@/components/loader";
import { ProfileCard } from "@/components/profile";
import { Frame, FrameHeader, FramePanel } from "@/components/reui/frame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ColorBadge } from "@/components/ui/badge";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
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
import { api, queryClient } from "@/hooks/api";
import { authClient } from "@/hooks/auth";
import type { API_Returns } from "@/lib/api";
import type { Role } from "@/lib/auth";
import { rolesObject } from "@/lib/role";
import { snakeToTitleCase } from "@/lib/utils";

type UserRecord = API_Returns["admin"]["getUsers"][number];

function EditUserDrawer({ user }: { user: UserRecord }) {
	const [open, setOpen] = useState(false);

	const { mutateAsync, isPending } = useMutation(
		api.admin.promote.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success({ title: "Role updated successfully" });
				setOpen(false);
			},
		}),
	);

	const form = useForm({
		defaultValues: {
			role: (user.role as Role) ?? "user",
		},
		onSubmit: async ({ value }) => {
			await mutateAsync({
				id: user.id,
				role: value.role,
			});
		},
	});

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger
				render={
					<Button variant="outline" size="icon-sm">
						<PenIcon />
					</Button>
				}
			/>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Edit User Role</DrawerTitle>
						<DrawerDescription>
							Promote or reassign role for {user.name} ({user.email})
						</DrawerDescription>
					</DrawerHeader>
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
											if (r) field.handleChange(r as Role);
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
					<DrawerFooter>
						<Button type="submit" disabled={isPending}>
							{isPending && <Spinner />}
							Submit
						</Button>
						<DrawerClose render={<Button variant="outline" />}>
							Cancel
						</DrawerClose>
					</DrawerFooter>
				</DrawerContent>
			</form>
		</Drawer>
	);
}

function UserActionsCell({ user }: { user: UserRecord }) {
	const { mutateAsync: impersonate, isPending: isImpersonating } = useMutation({
		mutationKey: ["impersonating-user", user.id],
		mutationFn: async () => {
			return await authClient.admin.impersonateUser(
				{
					userId: user.id,
				},
				{
					throw: true,
				},
			);
		},
		onSuccess: (data) => {
			toast.success({
				title: `You’re viewing as a ${data?.user.role ?? user.role}!`,
				description: "Any actions you take will be performed as this user.",
			});
		},
		onError: (err) => {
			toast.error({
				title: err.message || "Failed to impersonate user",
			});
		},
	});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="outline" size="icon-sm" disabled={isImpersonating}>
						{isImpersonating ? <Spinner /> : <MoreHorizontalIcon />}
					</Button>
				}
			/>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => impersonate()}>
					<ExternalLinkIcon />
					Impersonate
				</DropdownMenuItem>
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
	);
}

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

const columnHelper = createColumnHelper<DataTableFeatures, UserRecord>();

const columns: ColumnDef<DataTableFeatures, UserRecord>[] =
	columnHelper.columns([
		columnHelper.display({
			id: "user",
			header: "User",
			cell: ({ row }) => {
				const member = row.original;
				return (
					<Drawer>
						<DrawerTrigger
							nativeButton={false}
							render={
								<Item className="cursor-pointer p-0 text-left transition-opacity hover:opacity-80" />
							}
						>
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
								<ItemDescription>{member.email}</ItemDescription>
							</ItemContent>
						</DrawerTrigger>
						<DrawerContent>
							<DrawerHeader>
								<DrawerTitle>{member.name}</DrawerTitle>
								<DrawerDescription>{member.email}</DrawerDescription>
							</DrawerHeader>
							<ProfileCard user={member} />
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
			id: "role",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Role</TooltipTrigger>
					<TooltipContent>System authorization and access level</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => (
				<ColorBadge>
					{snakeToTitleCase(row.original.role) ?? "Not Assigned"}
				</ColorBadge>
			),
		}),
		columnHelper.display({
			id: "status",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">
						Account Status
					</TooltipTrigger>
					<TooltipContent>Active or suspended/banned status</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => {
				const member = row.original;
				if (member.banned) {
					return (
						<Tooltip>
							<TooltipTrigger>
								<ColorBadge variant="destructive">Banned</ColorBadge>
							</TooltipTrigger>
							<TooltipContent>
								<div className="flex flex-col gap-1 text-xs">
									{member.banReason && <span>Reason: {member.banReason}</span>}
									<span>
										Expires:{" "}
										{member.banExpires
											? `${getRelateTime(new Date(member.banExpires))} ago`
											: "Never"}
									</span>
								</div>
							</TooltipContent>
						</Tooltip>
					);
				}
				return <ColorBadge variant="success">Active</ColorBadge>;
			},
		}),
		columnHelper.accessor("createdAt", {
			header: "Joined",
			cell: ({ getValue }) => (
				<span className="text-muted-foreground text-xs">
					{getRelateTime(new Date(getValue()))} ago
				</span>
			),
		}),
		columnHelper.display({
			id: "edit",
			header: "Edit",
			cell: ({ row }) => <EditUserDrawer user={row.original} />,
		}),
		columnHelper.display({
			id: "actions",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help">Actions</TooltipTrigger>
					<TooltipContent>Administrative options and tools</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => <UserActionsCell user={row.original} />,
		}),
	]);

export default function Page() {
	const [search, setSearch] = useQueryState("q");
	const [role, setRole] = useQueryState("role");
	const searchQuery = useDebounce(search ?? undefined, 500);

	const { data = [], isPending } = useQuery(
		api.admin.getUsers.queryOptions({
			input: {
				searchQuery,
				role: (role as Role) ?? undefined,
			},
		}),
	);

	const table = useTable({
		features,
		data,
		columns,
	});

	if (isPending && !data.length) {
		return <Loader />;
	}

	return (
		<Frame>
			<FrameHeader className="flex-row items-center justify-between">
				<InputGroup className="w-xs">
					<InputGroupInput
						value={search ?? ""}
						onChange={(v) => setSearch(v.target.value)}
						placeholder="Search users"
					/>
					<InputGroupAddon>
						<Search />
					</InputGroupAddon>
				</InputGroup>
				<Select
					items={rolesObject}
					value={role ?? undefined}
					onValueChange={(r) => setRole((r as Role) ?? null)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Filter Roles" />
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
				<Button render={<Link href="/admin/users/new" />} nativeButton={false}>
					<UserPlusIcon />
					Create User
				</Button>
			</FrameHeader>
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
									No users found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</FramePanel>
		</Frame>
	);
}
