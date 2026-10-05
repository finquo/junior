"use client";

import { CalendarFoldIcon, GraduationCapIcon, UserPenIcon, VideoIcon } from "lucide-react";
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
							title: "Students",
							url: "/teacher/students",
							icon: <GraduationCapIcon />,
							fetchItems: {
								api: api.sidebar.students.queryOptions(),
								getLink: (id) => `teacher/student/${id}`,
							},
						},
					]}
				/>
				<NavMain
					title="Platform"
					items={[
						{
							title: "Sessions",
							url: "/teacher/sessions",
							icon: <VideoIcon />,
							subItems: [
								{
									title: "New Session",
									url: "/teacher/sessions/new",
								},
							],
						},
					]}
				/>
				<NavProjects
					title="Links"
					link={[
						{
							name: "Availability",
							url: "/teacher/availability",
							icon: <CalendarFoldIcon />,
						},
						{
							name: "Edit Profile",
							url: "/teacher/edit",
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
