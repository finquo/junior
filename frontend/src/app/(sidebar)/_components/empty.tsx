"use client";

import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
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
				<NavMain title="Users" items={[]} />
				<NavMain title="Platform" items={[]} />
				<NavProjects title="Profile" link={[]} />
			</SidebarContent>
			<SidebarFooter>{/*<NavUser />*/}</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
