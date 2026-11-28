"use client";

import {
	BookOpenCheckIcon,
	BriefcaseBusinessIcon,
	CalendarHeartIcon,
	ComponentIcon,
	FolderOpenIcon,
	GraduationCapIcon,
	LandPlotIcon,
	UserPenIcon,
	UserRoundCogIcon,
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
				<TeamSwitcher href="/qa_auditor" />
			</SidebarHeader>
			<SidebarContent>
				<NavMain
					title="Users"
					items={[
						{
							title: "Schedulers",
							url: "/schedulers",
							icon: <UserRoundCogIcon />,
							fetchItems: {
								api: api.sidebar.schedulers.queryOptions(),
								getLink: (id) => `/schedulers/${id}`,
							},
						},
						{
							title: "Teachers",
							url: "/teachers",
							icon: <BriefcaseBusinessIcon />,
							fetchItems: {
								api: api.sidebar.teachers.queryOptions(),
								getLink: (id) => `/teachers/${id}`,
							},
						},
						{
							title: "Students",
							url: "/students",
							icon: <GraduationCapIcon />,
							fetchItems: {
								api: api.sidebar.students.queryOptions(),
								getLink: (id) => `/students/${id}`,
							},
						},
					]}
				/>
				<NavMain
					title="Platform"
					items={[
						{
							title: "Programs",
							url: "/programs",
							icon: <ComponentIcon />,
							subItems: [
								{
									icon: <BookOpenCheckIcon />,
									title: "Lessons",
									url: "/lessons",
								},
							],
							fetchItems: {
								api: api.sidebar.programs.queryOptions(),
								getLink: (id) => `/programs/${id}`,
							},
						},
						{
							title: "Courses",
							url: "/courses",
							icon: <LandPlotIcon />,
							fetchItems: {
								api: api.sidebar.courses.queryOptions(),
								getLink: (id) => `/courses/${id}`,
							},
							subItems: [
								{
									icon: <BookOpenCheckIcon />,
									title: "Modules",
									url: "/modules",
								},
								{
									icon: <VideoIcon />,
									title: "Videos",
									url: "/videos",
								},
								{
									icon: <FolderOpenIcon />,
									title: "Media",
									url: "/courses/medias",
								},
							],
						},
						{
							title: "Slots",
							url: "/slots",
							icon: <VideoIcon />,
							fetchItems: {
								api: api.sidebar.slots.queryOptions(),
								getLink: (id) => `/slots/${id}`,
							},
						},
					]}
				/>
				<NavProjects
					title="Profile"
					link={[
						{
							name: "Calender",
							url: "/calender",
							icon: <CalendarHeartIcon />,
						},
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
