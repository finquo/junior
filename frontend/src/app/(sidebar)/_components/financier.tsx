"use client";

import {
	BookOpenCheckIcon,
	BriefcaseBusinessIcon,
	CalendarHeartIcon,
	ComponentIcon,
	GraduationCapIcon,
	LandPlotIcon,
	PlusIcon,
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
						},
						{
							title: "Students",
							url: "/students",
							icon: <GraduationCapIcon />,
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
									icon: <PlusIcon />,
									title: "Record Payment",
									url: "/payments/new",
								},
							],
						},
						{
							title: "Programs",
							url: "/programs",
							icon: <ComponentIcon />,
						},
						{
							title: "Courses",
							url: "/courses",
							icon: <LandPlotIcon />,
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
							],
						},
						{
							title: "Slots",
							url: "/slots",
							icon: <VideoIcon />,
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
