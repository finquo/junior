import { SchedulerSidebar } from "@/app/(sidebar)/_components/scheduler";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SwitchNode } from "@/components/utils";
import { SideBarHeader } from "./_components/header";

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<SwitchNode cases="children">
				<SchedulerSidebar />
			</SwitchNode>
			<SidebarInset>
				<SideBarHeader />
				{children}
			</SidebarInset>
		</SidebarProvider>
	);
}
