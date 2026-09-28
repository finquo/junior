import { SidebarConfig as AdminSidebar } from "@/app/(sidebar)/_components/admin";
import { SidebarConfig as SchedulerSidebar } from "@/app/(sidebar)/_components/scheduler";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RoleRender } from "@/hooks/role";
import { SideBarHeader } from "./_components/header";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<RoleRender
				scheduler={<SchedulerSidebar />}
				teacher={<SchedulerSidebar />}
				enrollment_advisor={<SchedulerSidebar />}
				student={<SchedulerSidebar />}
				admin={<AdminSidebar />}
				qa_auditor={<SchedulerSidebar />}
			/>
			<SidebarInset>
				<SideBarHeader />
				<div className="p-3">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
