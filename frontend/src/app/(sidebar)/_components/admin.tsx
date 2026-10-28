"use client";

import {
	BookOpenCheckIcon,
	BriefcaseBusinessIcon,
	CalendarHeartIcon,
	ComponentIcon,
	GraduationCapIcon,
	PlusIcon,
	ScanEyeIcon,
	UserPenIcon,
	UserRoundCogIcon,
	UserRoundGroupIcon,
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
							title: "Users",
							url: "/admin/users",
							icon: <UserRoundGroupIcon />,
							subItems: [
								{
									icon: <PlusIcon />,
									title: "Create User",
									url: "/admin/users/new",
								},
							],
						},
						{
							title: "Schedulers",
							url: "/schedulers",
							icon: <UserRoundCogIcon />,
							subItems: [
								{
									icon: <PlusIcon />,
									title: "Create New",
									url: "/schedulers/new",
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
									icon: <PlusIcon />,
									title: "Create New",
									url: "/teachers/new",
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
									icon: <PlusIcon />,
									title: "Create New",
									url: "/students/new",
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
							fetchItems: {
								api: api.sidebar.programs.queryOptions(),
								getLink: (id) => `/programs/${id}`,
							},
							subItems: [
								{
									icon: <PlusIcon />,
									title: "Create New",
									url: "/programs/new",
								},
							],
						},
						{
							title: "Lessons",
							url: "/lessons",
							icon: <BookOpenCheckIcon />,
							subItems: [
								{
									icon: <PlusIcon />,
									title: "Create New",
									url: "/lessons/new",
								},
							],
						},
						{
							title: "Slots",
							url: "/slots",
							icon: <VideoIcon />,
							subItems: [
								{
									icon: <PlusIcon />,
									title: "Create New",
									url: "/slots/new",
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
							name: "Home",
							url: "/admin",
							icon: <ScanEyeIcon />,
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
