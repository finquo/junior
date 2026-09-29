"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { Search } from "lucide-react";
import { useQueryState } from "nuqs";
import { getRelateTime } from "utils";
import { ProfileCard } from "@/components/profile";
import { Frame, FramePanel } from "@/components/reui/frame";
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
import { UserList } from "@/components/user";
import { api } from "@/hooks/api";
import type { Role, USER } from "@/lib/auth";
import { rolesObject } from "@/lib/role";
import { snakeToTitleCase } from "@/lib/utils";

function UserTableRow({ member }: { member: USER }) {
	const { mutateAsync } = useMutation(api.admin.promote.mutationOptions());
	return (
		<TableRow>
			<TableCell>
				<UserList user={member} />
			</TableCell>
			<TableCell>
				<ColorBadge>
					{snakeToTitleCase(member.role) ?? "Not Assigned"}
				</ColorBadge>
			</TableCell>
			<TableCell>
				{member.banned ? (
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
										? `${getRelateTime(member.banExpires)} ago`
										: "Never"}
								</span>
							</div>
						</TooltipContent>
					</Tooltip>
				) : (
					<ColorBadge variant="success">Active</ColorBadge>
				)}
			</TableCell>
			<TableCell>
				<span className="text-muted-foreground text-xs">
					{getRelateTime(member.createdAt)} ago
				</span>
			</TableCell>
			<TableCell>
				<Select
					items={rolesObject}
					onValueChange={(r) => mutateAsync({ id: member.id, role: r as Role })}
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
			</TableCell>
			<TableCell>
				<Drawer>
					<DrawerTrigger render={<Button variant="outline" size="sm" />}>
						View Profile
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
			</TableCell>
		</TableRow>
	);
}

export default function () {
	const [search, setSearch] = useQueryState("q");
	const [role, setRole] = useQueryState("role");
	const searchQuery = useDebounce(search ?? undefined, 500);

	const { data } = useQuery(
		api.admin.getUsers.queryOptions({
			input: {
				searchQuery,
				role: role ?? undefined,
			},
		}),
	);

	return (
		<TooltipProvider>
			<Frame>
				<FramePanel className="flex flex-row gap-4">
					<InputGroup className="w-xs">
						<InputGroupInput
							value={search as string}
							onChange={(v) => setSearch(v.target.value)}
							placeholder="Search users"
						/>
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
					<Select items={rolesObject} onValueChange={(r) => setRole(r as Role)}>
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
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Account Status</TableHead>
								<TableHead>Joined</TableHead>
								<TableHead>Change Role</TableHead>
								<TableHead>Profile</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data?.map((member) => (
								<UserTableRow key={member.email} member={member} />
							))}
						</TableBody>
					</Table>
				</FramePanel>
			</Frame>
		</TooltipProvider>
	);
}
