"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
import { useDebounce } from "@uidotdev/usehooks";
import { ExternalLinkIcon, Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { sileo as toast } from "sileo";
import { getRelateTime } from "utils";
import Loader from "@/components/loader";
import { ProfileCard } from "@/components/profile";
import { Frame, FramePanel } from "@/components/reui/frame";
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
import { api, queryClient } from "@/hooks/api";
import { authClient } from "@/hooks/auth";
import { MutationButton } from "@/hooks/button";
import type { Role } from "@/lib/auth";
import { rolesObject } from "@/lib/role";
import { snakeToTitleCase } from "@/lib/utils";

type UserRecord = NonNullable<
	Awaited<
		ReturnType<
			NonNullable<
				ReturnType<typeof api.admin.getUsers.queryOptions>["queryFn"]
			>
		>
	>
>[number];

function ChangeRoleCell({ user }: { user: UserRecord }) {
	const { mutateAsync, isPending } = useMutation(
		api.admin.promote.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success({ title: "Role updated successfully" });
			},
		}),
	);

	return (
		<Select
			items={rolesObject}
			value={user.role ?? undefined}
			disabled={isPending}
			onValueChange={(r) => {
				if (r) {
					mutateAsync({ id: user.id, role: r as Role });
				}
			}}
		>
			<SelectTrigger size="sm">
				<SelectValue placeholder="Edit Role" />
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
	);
}

function ImpersonateCell({ user }: { user: UserRecord }) {
	return (
		<MutationButton
			onSuccess={(data) => {
				toast.success({
					title: `You’re viewing as a ${data?.user.role ?? user.role}!`,
					description: "Any actions you take will be performed as this user.",
				});
			}}
			api={{
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
			}}
			mutate={(mutate) => (
				<Button onClick={() => mutate()} variant="outline" size="icon-sm">
					<ExternalLinkIcon />
				</Button>
			)}
		/>
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
	filterFns: { includesSring: filterFn_includesString },
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
							render={
								<Item className="cursor-pointer p-0 text-left hover:opacity-80 transition-opacity" />
							}
						>
							<ItemMedia>
								<Avatar size="sm">
									<AvatarImage
										src={member.image ?? undefined}
										alt={member.name}
									/>
									<AvatarFallback>
										{member.name?.[0] ?? "U"}
									</AvatarFallback>
								</Avatar>
							</ItemMedia>
							<ItemContent>
								<ItemTitle>{member.name}</ItemTitle>
								<ItemDescription>{member.email}</ItemDescription>
							</ItemContent>
						</DrawerTrigger>
						<DrawerContent className="overflow-y-auto">
							<DrawerHeader>
								<DrawerTitle>{member.name}</DrawerTitle>
								<DrawerDescription>{member.email}</DrawerDescription>
							</DrawerHeader>
							<div className="p-4">
								<ProfileCard user={member} />
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
			id: "role",
			header: "Role",
			cell: ({ row }) => (
				<ColorBadge>
					{snakeToTitleCase(row.original.role) ?? "Not Assigned"}
				</ColorBadge>
			),
		}),
		columnHelper.display({
			id: "status",
			header: "Account Status",
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
									{member.banReason && (
										<span>Reason: {member.banReason}</span>
									)}
									<span>
										Expires:{" "}
										{member.banExpires
											? `${getRelateTime(member.banExpires)} ago`
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
					{getRelateTime(getValue())} ago
				</span>
			),
		}),
		columnHelper.display({
			id: "changeRole",
			header: "Change Role",
			cell: ({ row }) => <ChangeRoleCell user={row.original} />,
		}),
		columnHelper.display({
			id: "actions",
			header: "Actions",
			cell: ({ row }) => <ImpersonateCell user={row.original} />,
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
		<TooltipProvider>
			<Frame>
				<FramePanel className="flex flex-row gap-4">
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
								<SelectItem value={undefined}>None</SelectItem>
							</SelectGroup>
						</SelectContent>
					</Select>
				</FramePanel>
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
										No users found
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
