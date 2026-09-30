import { SidebarConfig as AdminSidebar } from "@/app/(sidebar)/_components/admin";
import { SidebarConfig as SchedulerSidebar } from "@/app/(sidebar)/_components/scheduler";
import { SidebarConfig as TeacherSidebar } from "@/app/(sidebar)/_components/teacher";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RoleRender } from "@/hooks/role";
import { SideBarHeader } from "./_components/header";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<RoleRender
				user={null}
				admin={<AdminSidebar />}
				scheduler={<SchedulerSidebar />}
				teacher={<TeacherSidebar />}
				enrollment_advisor={null}
				student={null}
				qa_auditor={null}
			/>
			<SidebarInset>
				<SideBarHeader />
				<div className="relative min-h-svh p-3">
					{children}
					{/*<ImpersonationBanner />*/}
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
