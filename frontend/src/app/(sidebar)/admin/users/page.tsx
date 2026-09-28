"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/reui/badge";
import { Frame, FramePanel } from "@/components/reui/frame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { createStrictArray, snakeToTitleCase } from "@/lib/utils";

const items = createStrictArray<Role>()(
	"admin",
	"enrollment_advisor",
	"qa_auditor",
	"scheduler",
	"student",
	"teacher",
).map((r) => ({ value: r, label: snakeToTitleCase(r) }));

interface UserTableRowProps {
	member: USER;
}

function UserTableRow({ member }: UserTableRowProps) {
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
				<Badge size="sm">{member.role}</Badge>
			</TableCell>
			<TableCell>
				<Select
					items={items}
					onValueChange={(r) => mutateAsync({ id: member.id, role: r as Role })}
				>
					<SelectTrigger size="sm">
						<SelectValue placeholder="Edit Roles" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{items.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</TableCell>
		</TableRow>
	);
}

export default function () {
	const [role, setRole] = useState<Role>();
	const { data } = useQuery(
		api.admin.getUsers.queryOptions({
			input: {
				role,
			},
		}),
	);
	return (
		<Frame>
			<FramePanel className="flex flex-row gap-4">
				<InputGroup className="max-w-xs">
					<InputGroupInput placeholder="Search..." />
					<InputGroupAddon>
						<Search />
					</InputGroupAddon>
					<InputGroupAddon align="inline-end">12 results</InputGroupAddon>
				</InputGroup>
				<Select items={items} onValueChange={(r) => setRole(r as Role)}>
					<SelectTrigger>
						<SelectValue placeholder="Filter Roles" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{items.map((item) => (
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
