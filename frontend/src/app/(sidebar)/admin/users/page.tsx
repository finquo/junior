"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import { Search } from "lucide-react";
import { useQueryState } from "nuqs";
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
import { api } from "@/hooks/api";
import type { Role, USER } from "@/lib/auth";
import { rolesObject } from "@/lib/role";
import { snakeToTitleCase } from "@/lib/utils";

function UserTableRow({ member }: { member: USER }) {
	const { mutateAsync } = useMutation(api.admin.promote.mutationOptions());
	return (
		<TableRow>
			<TableCell>
				<div className="flex items-center gap-3">
					<Avatar size="sm">
						<AvatarImage
							src={member.image ?? "https://github.com/rajatsandeepsen.png"}
							alt={member.name}
						/>
						<AvatarFallback>
							{member.name
								.split(" ")
								.map((n) => n[0])
								.join("")}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<span className="font-medium text-sm">{member.name}</span>
						<span className="text-muted-foreground text-xs">
							{member.email}
						</span>
					</div>
				</div>
			</TableCell>
			<TableCell>
				<ColorBadge>{snakeToTitleCase(member.role)}</ColorBadge>
			</TableCell>
			<TableCell>
				<Select
					items={rolesObject}
					onValueChange={(r) => mutateAsync({ id: member.id, role: r as Role })}
				>
					<SelectTrigger size="sm">
						<SelectValue placeholder="Edit Roles" />
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
				<Drawer swipeDirection={"right"}>
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
		<Frame>
			<FramePanel className="flex flex-row gap-4">
				<InputGroup className="max-w-xs">
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
							<TableHead>Member</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Edit</TableHead>
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
	);
}
