"use client";

import { plans } from "backend/config";
import {
	BookOpenCheckIcon,
	BriefcaseBusinessIcon,
	ComponentIcon,
	GraduationCapIcon,
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
									title: "Create New Scheduler",
									url: "/schedulers/new",
								},
							],
						},
						{
							title: "Teachers",
							url: "/teachers",
							icon: <BriefcaseBusinessIcon />,
							subItems: [
								{
									title: "Create New Teacher",
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
									title: "Create New Student",
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
							url: "/admin/programs",
							icon: <ComponentIcon />,
							subItems: plans.map((p) => ({
								title: p.name,
								url: "#",
							})),
						},
						{
							title: "Lessons",
							url: "/lessons",
							icon: <BookOpenCheckIcon />,
							subItems: [
								{
									title: "Create New Lesson",
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
									title: "Create New Slot",
									url: "/slots/new",
								},
							],
						},
					]}
				/>
				<NavProjects
					title="Profile"
					link={[
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
