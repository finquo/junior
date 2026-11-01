"use client";

import {
	BookOpenCheckIcon,
	BriefcaseBusinessIcon,
	CalendarHeartIcon,
	ComponentIcon,
	GraduationCapIcon,
	ListIcon,
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
							subItems: [
								{
									icon: <ListIcon />,
									title: "Show List",
									url: "/schedulers",
								},
							],
							fetchItems: {
								api: api.sidebar.schedulers.queryOptions(),
								getLink: (id) => `/schedulers/${id}`,
							},
						},
						{
							title: "Teachers",
							url: "/teachers",
							icon: <BriefcaseBusinessIcon />,
							subItems: [
								{
									icon: <ListIcon />,
									title: "Show List",
									url: "/teachers",
								},
							],
							fetchItems: {
								api: api.sidebar.teachers.queryOptions(),
								getLink: (id) => `/teachers/${id}`,
							},
						},
						{
							title: "Students",
							url: "/students",
							icon: <GraduationCapIcon />,
							subItems: [
								{
									icon: <ListIcon />,
									title: "Show List",
									url: "/students",
								},
							],
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
									icon: <ListIcon />,
									title: "Show List",
									url: "/programs",
								},
							],
							fetchItems: {
								api: api.sidebar.programs.queryOptions(),
								getLink: (id) => `/programs/${id}`,
							},
						},
						{
							title: "Lessons",
							url: "/lessons",
							icon: <BookOpenCheckIcon />,
							subItems: [
								{
									icon: <ListIcon />,
									title: "Show List",
									url: "/lessons",
								},
							],
						},
						{
							title: "Slots",
							url: "/slots",
							icon: <VideoIcon />,
							subItems: [
								{
									icon: <ListIcon />,
									title: "Show List",
									url: "/slots",
								},
							],
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
