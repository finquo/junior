"use client";

import {
	BriefcaseBusinessIcon,
	FrameIcon,
	GraduationCapIcon,
	MapIcon,
	PieChartIcon,
	Settings2Icon,
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
							title: "Teachers",
							url: "/scheduler/teachers",
							icon: <BriefcaseBusinessIcon />,
							fetchItems: {
								api: api.sidebar.teachers.queryOptions(),
								getLink: (id) => `scheduler/teacher/${id}`,
							},
						},
						{
							title: "Students",
							url: "/scheduler/students",
							icon: <GraduationCapIcon />,
							fetchItems: {
								api: api.sidebar.students.queryOptions(),
								getLink: (id) => `scheduler/student/${id}`,
							},
						},
					]}
				/>
				<NavMain
					title="Platform"
					items={[
						{
							title: "Sessions",
							url: "/scheduler/sessions",
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
					title="Links"
					link={[
						{
							name: "Design Engineering",
							url: "#",
							icon: <FrameIcon />,
						},
						{
							name: "Sales & Marketing",
							url: "#",
							icon: <PieChartIcon />,
						},
						{
							name: "Travel",
							url: "#",
							icon: <MapIcon />,
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
