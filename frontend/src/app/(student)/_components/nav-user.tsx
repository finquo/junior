"use client";

import { LogOutIcon, UserPenIcon } from "lucide-react";
import Link from "next/link";
import { sileo as toast } from "sileo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient, useAuth } from "@/hooks/auth";
import { getInitials } from "@/lib/utils";

export function StudentNavUser() {
	const { data: user, impersonation } = useAuth();

	if (!user) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="icon-lg"
					aria-label={
						impersonation ? "Impersonating — open account menu" : user.name
					}
				>
					<Avatar>
						<AvatarImage src={user.image} alt={user.name} />
						<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-fit"
				side="top"
				align="end"
				sideOffset={4}
			>
				<DropdownMenuGroup>
					<DropdownMenuLabel className="p-0 font-normal">
						<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
							<Avatar>
								<AvatarImage src={user.image} alt={user.name} />
								<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-xs">{user.email}</span>
							</div>
						</div>
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Button variant="link" asChild>
						<Link href={"/student/edit" as "/"}>
							<UserPenIcon />
							Edit Profile
						</Link>
					</Button>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={async () =>
						impersonation
							? await authClient.admin.stopImpersonating(
									{},
									{
										throw: true,
										onSuccess: () => {
											toast.success({
												title: "You’re back to your role",
											});
										},
									},
								)
							: await authClient.signOut(
									{},
									{
										throw: true,
										onSuccess: () => {
											toast.success({
												title: "You’re signed out",
											});
										},
									},
								)
					}
				>
					<LogOutIcon />
					{impersonation ? "Stop Impersonating" : "Log Out"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
