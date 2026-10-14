"use client";

import { EllipsisVerticalIcon, LogOutIcon } from "lucide-react";
import { sileo as toast } from "sileo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { authClient, useAuth } from "@/hooks/auth";
import { getInitials } from "@/lib/utils";

export function NavUser() {
	const { data: user, impersonation } = useAuth();
	const { isMobile } = useSidebar();

	if (!user) return null;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							variant={impersonation ? "warning" : "default"}
							size="lg"
							className="aria-expanded:bg-muted"
						>
							<Avatar>
								<AvatarImage src={user.image} alt={user.name} />
								<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-xs">{user.email}</span>
							</div>
							<EllipsisVerticalIcon className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-fit"
						side={isMobile ? "bottom" : "right"}
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
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
