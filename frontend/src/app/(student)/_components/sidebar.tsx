"use client";

import {
	BriefcaseBusinessIcon,
	FrameIcon,
	Settings2Icon,
	UserPenIcon,
	VideoIcon,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { api } from "@/hooks/api";

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
							title: "Mentor",
							url: "/student/mentor",
							icon: <BriefcaseBusinessIcon />,
							fetchItems: {
								api: api.sidebar.teachers.queryOptions(),
								getLink: (id) => `scheduler/teacher/${id}`,
							},
						},
					]}
				/>
				<NavMain
					title="Platform"
					items={[
						{
							title: "Sessions",
							url: "/student/sessions",
							icon: <VideoIcon />,
							subItems: [
								{
									title: "Introduction",
									url: "#",
								},
								{
									title: "Get Started",
									url: "#",
								},
								{
									title: "Tutorials",
									url: "#",
								},
							],
						},
						{
							title: "Settings",
							url: "#",
							icon: <Settings2Icon />,
							subItems: [
								{
									title: "General",
									url: "#",
								},
							],
						},
					]}
				/>
				<NavProjects
					title="Profile"
					link={[
						{
							name: "Edit",
							url: "/user/edit",
							icon: <UserPenIcon />,
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
