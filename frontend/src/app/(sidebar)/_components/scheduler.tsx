"use client";

import {
	BriefcaseBusinessIcon,
	FrameIcon,
	GalleryVerticalEndIcon,
	GraduationCapIcon,
	MapIcon,
	PieChartIcon,
	Settings2Icon,
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
			title: "Sessions",
			url: "/scheduler/sessions",
			icon: <VideoIcon />,
			items: [
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
				{
					title: "Changelog",
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
				{
					title: "Billing",
					url: "#",
				},
				{
					title: "Limits",
					url: "#",
				},
			],
		},
	],
	users: [
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
			items: [
				{
					title: "Rajat",
					url: "#",
				},
				{
					title: "Rajat Sandeep",
					url: "#",
				},
				{
					title: "Rajat Sandeep Sen",
					url: "#",
				},
			],
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

export function SchedulerSidebar({
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
