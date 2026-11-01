"use client";

import {
	BriefcaseBusinessIcon,
	CalendarHeartIcon,
	ComponentIcon,
	GraduationCapIcon,
	ListIcon,
	UserPenIcon,
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

export function SidebarConfig({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher href="/financier" />
			</SidebarHeader>
			<SidebarContent>
				<NavMain
					title="Users"
					items={[
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
						},
					]}
				/>
				<NavMain
					title="Platform"
					items={[
						{
							title: "Payments",
							url: "/payments",
							icon: <WalletIcon />,
							subItems: [
								{
									icon: <ListIcon />,
									title: "Show List",
									url: "/payments",
								},
							],
						},
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
