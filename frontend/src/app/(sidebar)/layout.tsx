"use client";

import { SchedulerSidebar } from "@/app/(sidebar)/_components/scheduler";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SwitchNode } from "@/components/utils";
import { useAuth } from "@/hooks/auth";
import { SideBarHeader } from "./_components/header";

export default function Layout({ children }: { children: React.ReactNode }) {
	const { data } = useAuth();

	return (
		<SidebarProvider>
			{data?.role && (
				<SwitchNode
					cases={data.role}
					scheduler={<SchedulerSidebar />}
					teacher={<SchedulerSidebar />}
					enrollment_advisor={<SchedulerSidebar />}
					student={<SchedulerSidebar />}
					admin={<SchedulerSidebar />}
					qa_auditor={<SchedulerSidebar />}
				/>
			)}
			<SidebarInset>
				<SideBarHeader />
				<div className="p-3">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
