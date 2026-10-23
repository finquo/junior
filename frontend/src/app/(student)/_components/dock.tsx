"use client";

import {
	BookOpenIcon,
	BriefcaseBusinessIcon,
	CalendarClockIcon,
	GraduationCapIcon,
	UserRoundIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { ExpandingButtonGroup } from "@/components/arc/expanding-button-group/expanding-button-group";
import { StudentNavUser } from "./nav-user";

const navItems = [
	{
		id: "profile",
		label: "Profile",
		url: "/student",
		icon: <UserRoundIcon />,
	},
	{
		id: "mentor",
		label: "Mentor",
		url: "/student/mentor",
		icon: <BriefcaseBusinessIcon />,
	},
	{
		id: "program",
		label: "Program",
		url: "/student/program",
		icon: <GraduationCapIcon />,
	},
	{
		id: "sessions",
		label: "Sessions",
		url: "/student/sessions",
		icon: <CalendarClockIcon />,
	},
	{
		id: "lessons",
		label: "Lessons",
		url: "/student/lessons",
		icon: <BookOpenIcon />,
	},
] as const;

export function StudentDock() {
	const router = useRouter();
	const pathname = usePathname();
	const current = navItems.find((item) => item.url === pathname);

	return (
		<div className="fixed inset-x-0 bottom-10 z-50 flex items-center justify-center gap-2">
			<ExpandingButtonGroup
				label="Student navigation"
				defaultExpanded={current?.id}
				items={navItems.map((item) => ({
					id: item.id,
					label: item.label,
					icon: item.icon,
					onSelect: () => router.push(item.url as "/"),
				}))}
			/>
			<StudentNavUser />
		</div>
	);
}
