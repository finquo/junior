"use client";

import {
	BriefcaseBusinessIcon,
	CalendarClockIcon,
	FrameIcon,
	GalleryVerticalEndIcon,
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

const data = {
	user: {
		name: "Rajat",
		email: "rajat@finquo.ai",
		avatar: "https://github.com/rajatsandeepsen.png",
	},
	teams: [
		{
			name: "Acme Inc",
			logo: <GalleryVerticalEndIcon />,
			plan: "Enterprise",
		},
	],
	platform: [
		{
			title: "Programs",
			url: "/admin/sessions",
			icon: <VideoIcon />,
			items: [
				{
					title: "Financial Literacy",
					url: "#",
				},
				{
					title: "AI",
					url: "#",
				},
				{
					title: "Cyber",
					url: "#",
				},
			],
		},
		{
			title: "Settings",
			url: "#",
			icon: <Settings2Icon />,
			items: [
				{
					title: "General",
					url: "#",
				},
				{
					title: "Team",
					url: "#",
				},
			],
		},
	],
	users: [
		{
			title: "Users",
			url: "/admin/users",
			icon: <UserRoundGroupIcon />,
			subItems: [
				{
					title: "Create User",
					url: "/create",
				},
			],
		},
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
		{
			title: "Slots",
			url: "/admin/slots",
			icon: <CalendarClockIcon />,
			fetchItems: {
				api: api.sidebar.slots.queryOptions(),
				getLink: (id) => `admin/slot/${id}`,
			},
		},
	] satisfies NavMainType["items"],
	links: [
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
	],
};

export function SidebarConfig({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain title="Users" items={data.users} />
				<NavMain title="Platform" items={data.platform} />
				<NavProjects title="Links" link={data.links} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
