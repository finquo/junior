"use client";

import {
	BookOpenCheckIcon,
	BriefcaseBusinessIcon,
	CalendarHeartIcon,
	ComponentIcon,
	FolderOpenIcon,
	GraduationCapIcon,
	LandPlotIcon,
	MessageSquareWarningIcon,
	PackageIcon,
	PlusIcon,
	ScanEyeIcon,
	UserPenIcon,
	UserRoundCogIcon,
	UserRoundGroupIcon,
	VideoIcon,
	WalletIcon,
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
				<TeamSwitcher href="/admin" />
			</SidebarHeader>
			<SidebarContent>
				<NavMain
					title="Users"
					items={[
						{
							title: "Users",
							url: "/users",
							icon: <UserRoundGroupIcon />,
							subItems: [
								{
									icon: <PlusIcon />,
									title: "Create User",
									url: "/users/new",
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
								{
									icon: <BookOpenCheckIcon />,
									title: "Lessons",
									url: "/lessons",
								},
							],
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
									icon: <PlusIcon />,
									title: "Create New",
									url: "/courses/new",
								},
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
							title: "Materials",
							url: "/materials",
							icon: <PackageIcon />,
							subItems: [
								{
									icon: <PlusIcon />,
									title: "Create New",
									url: "/materials/new",
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
								{
									icon: <FolderOpenIcon />,
									title: "Media",
									url: "/medias",
								},
								{
									icon: <MessageSquareWarningIcon />,
									title: "Feedback",
									url: "/feedbacks",
								},
							],
							// fetchItems: {
							// 	api: api.sidebar.slots.queryOptions(),
							// 	getLink: (id) => `/slots/${id}`,
							// },
						},
						{
							title: "Payments",
							url: "/payments",
							icon: <WalletIcon />,
							subItems: [
								{
									icon: <PlusIcon />,
									title: "Record Payment",
									url: "/payments/new",
								},
							],
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
