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
import { ExternalLinkIcon, PenIcon, Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
			NonNullable<ReturnType<typeof api.admin.getUsers.queryOptions>["queryFn"]>
		>
	>
>[number];

function ChangeRoleCell({ user }: { user: UserRecord }) {
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
			supervisorId: "",
			mentorId: "",
		},
		onSubmit: async ({ value }) => {
			if (value.role === "teacher") {
				await mutateAsync({
					id: user.id,
					role: "teacher",
					supervisorId: value.supervisorId,
				});
			} else if (value.role === "student") {
				await mutateAsync({
					id: user.id,
					role: "student",
					supervisorId: value.supervisorId,
					mentorId: value.mentorId,
				});
			} else {
				await mutateAsync({
					id: user.id,
					role: value.role,
				});
			}
		},
	});

	return (
		<Drawer open={open} onOpenChange={setOpen}>
			<DrawerTrigger
				nativeButton={false}
				render={<Button variant="outline" size="sm" />}
			>
				Change Role
			</DrawerTrigger>
			<DrawerContent className="overflow-y-auto">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<DrawerHeader>
						<DrawerTitle>Change Role</DrawerTitle>
						<DrawerDescription>
							Promote or reassign role for {user.name} ({user.email})
						</DrawerDescription>
					</DrawerHeader>
					<div className="flex flex-col gap-4 p-4">
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
							<form.Subscribe
								selector={(state) => state.values.role}
								children={(role) => (
									<>
										{(role === "teacher" || role === "student") && (
											<form.Field
												name="supervisorId"
												children={(field) => (
													<Field>
														<FieldLabel htmlFor={field.name}>
															Supervisor ID
														</FieldLabel>
														<Input
															id={field.name}
															name={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															placeholder="Enter supervisor ID..."
															disabled={isPending}
															required
														/>
													</Field>
												)}
											/>
										)}

										{role === "student" && (
											<form.Field
												name="mentorId"
												children={(field) => (
													<Field>
														<FieldLabel htmlFor={field.name}>
															Mentor ID
														</FieldLabel>
														<Input
															id={field.name}
															name={field.name}
															value={field.state.value}
															onBlur={field.handleBlur}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															placeholder="Enter mentor ID..."
															disabled={isPending}
															required
														/>
													</Field>
												)}
											/>
										)}
									</>
								)}
							/>
						</FieldGroup>
					</div>
					<DrawerFooter>
						<Button type="submit" disabled={isPending}>
							{isPending && <Spinner />}
							Submit
						</Button>
						<DrawerClose
							nativeButton={false}
							render={<Button variant="outline" />}
						>
							Cancel
						</DrawerClose>
					</DrawerFooter>
				</form>
			</DrawerContent>
		</Drawer>
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
								<Item className="cursor-pointer p-0 text-left transition-opacity transition-opacity hover:opacity-80" />
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
						<DrawerContent className="overflow-y-auto">
							<DrawerHeader>
								<DrawerTitle>{member.name}</DrawerTitle>
								<DrawerDescription>{member.email}</DrawerDescription>
							</DrawerHeader>
							<div className="p-4">
								<ProfileCard user={member} />
							</div>
							<DrawerFooter>
								<DrawerClose
									nativeButton={false}
									render={<Button variant="outline" />}
								>
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
					<TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
						Role
					</TooltipTrigger>
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
					<TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
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
			id: "changeRole",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
						Change Role
					</TooltipTrigger>
					<TooltipContent>
						Promote or reassign user permission level
					</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => <ChangeRoleCell user={row.original} />,
		}),
		columnHelper.display({
			id: "actions",
			header: () => (
				<Tooltip>
					<TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
						Actions
					</TooltipTrigger>
					<TooltipContent>
						Impersonation and administrative tools
					</TooltipContent>
				</Tooltip>
			),
			cell: ({ row }) => <ImpersonateCell user={row.original} />,
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
							<DrawerTitle>Edit User</DrawerTitle>
							<DrawerDescription>Edit user account settings</DrawerDescription>
						</DrawerHeader>
						<div className="p-4" />
						<DrawerFooter>
							<DrawerClose
								nativeButton={false}
								render={<Button variant="outline" />}
							>
								Close
							</DrawerClose>
						</DrawerFooter>
					</DrawerContent>
				</Drawer>
			),
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
									<TableCell colSpan={columns.length} className="text-center">
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
