"use client";

import { plans } from "backend/config";
import {
	BookOpenCheckIcon,
	BriefcaseBusinessIcon,
	CalendarClockIcon,
	FrameIcon,
	GraduationCapIcon,
	MapIcon,
	PieChartIcon,
	Settings2Icon,
	UserRoundCogIcon,
	UserRoundGroupIcon,
	VideoIcon,
} from "lucide-react";
import type * as React from "react";
import { NavMain, type NavMainType } from "@/components/nav-main";
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
						/**
						{
							title: "Schedulers",
							url: "/admin/schedulers",
							icon: <UserRoundCogIcon />,
							fetchItems: {
								api: api.sidebar.schedulers.queryOptions(),
								getLink: (id) => `admin/scheduler/${id}`,
							},
						},
						{
							title: "Teachers",
							url: "/admin/teachers",
							icon: <BriefcaseBusinessIcon />,
							fetchItems: {
								api: api.sidebar.teachers.queryOptions(),
								getLink: (id) => `admin/teacher/${id}`,
							},
						},
						{
							title: "Students",
							url: "/admin/students",
							icon: <GraduationCapIcon />,
							fetchItems: {
								api: api.sidebar.students.queryOptions(),
								getLink: (id) => `admin/student/${id}`,
							},
						},
					 	*/
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
