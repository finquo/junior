"use client";

import {
	BookHeartIcon,
	BookOpenIcon,
	CalendarClockIcon,
	GraduationCapIcon,
	HomeIcon,
	LandPlotIcon,
	UserRoundIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { ExpandingButtonGroup } from "@/components/animate/expanding-button-group";
import { StudentNavUser } from "./nav-user";

const navItems = [
	{
		id: "Home",
		label: "Home",
		href: "/student",
		icon: <HomeIcon />,
	},
	{
		id: "profile",
		label: "Profile",
		href: "/student/profile",
		icon: <UserRoundIcon />,
	},
	{
		id: "mentor",
		label: "Mentor",
		href: "/student/mentor",
		icon: <BookHeartIcon />,
	},
	{
		id: "course",
		label: "Course",
		href: "/student/courses" as "/",
		icon: <LandPlotIcon />,
	},
	{
		id: "program",
		label: "Program",
		href: "/student/program",
		icon: <GraduationCapIcon />,
	},
	{
		id: "sessions",
		label: "Sessions",
		href: "/student/sessions",
		icon: <CalendarClockIcon />,
	},
	{
		id: "lessons",
		label: "Lessons",
		href: "/student/lessons",
		icon: <BookOpenIcon />,
	},
] as const;

export function StudentDock() {
	const pathname = usePathname();

	return (
		<nav
			aria-label="Student navigation"
			className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
		>
			<div className="flex flex-wrap items-center justify-center gap-2">
				<ExpandingButtonGroup
					groupLabel="Student sections"
					items={navItems.map((item) => ({
						...item,
						active: pathname === item.href,
					}))}
				/>
				<StudentNavUser />
			</div>
		</nav>
	);
}
