"use client";

import { plans } from "backend/config";
import { BookOpenCheckIcon, UserRoundGroupIcon, VideoIcon } from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";

export function SidebarConfig({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher />
			</SidebarHeader>
			<SidebarContent>
				<NavMain
					title="Users"
					items={[
						{
							title: "Users",
							url: "/admin/users",
							icon: <UserRoundGroupIcon />,
							subItems: [
								{
									title: "Create User",
									url: "/admin/users/new",
								},
							],
						},
					]}
				/>
				<NavMain
					title="Platform"
					items={[
						{
							title: "Programs",
							url: "/admin/programs",
							icon: <VideoIcon />,
							subItems: plans.map((p) => ({
								title: p.name,
								url: "#",
							})),
						},
						{
							title: "Lessons",
							url: "/admin/lessons",
							icon: <BookOpenCheckIcon />,
						},
					]}
				/>
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
