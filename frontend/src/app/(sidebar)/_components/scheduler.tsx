"use client";

import {
	BookOpenCheckIcon,
	BriefcaseBusinessIcon,
	GraduationCapIcon,
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
									title: "New Session",
									url: "/scheduler/sessions/new",
								},
							],
						},
						{
							title: "Lessons",
							url: "/scheduler/lessons",
							icon: <BookOpenCheckIcon />,
							subItems: [
								{
									title: "New Lessons",
									url: "/scheduler/lessons/new",
								},
							],
						},
					]}
				/>
				<NavProjects
					title="Links"
					link={[
						{
							name: "Edit Profile",
							url: "/scheduler/edit",
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
