import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { RoleRender } from "@/hooks/role";
import { SidebarConfig as GuestSidebar } from "./_components/guest-sidebar";
import { SidebarConfig as TeacherSidebar } from "./_components/teacher-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
	return children;
	return (
		<SidebarProvider>
			<RoleRender
				admin={<GuestSidebar />}
				scheduler={<GuestSidebar />}
				teacher={<TeacherSidebar />}
				enrollment_advisor={<GuestSidebar />}
				student={<GuestSidebar />}
				qa_auditor={<GuestSidebar />}
				user={<GuestSidebar />}
			>
				<GuestSidebar />
			</RoleRender>
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
