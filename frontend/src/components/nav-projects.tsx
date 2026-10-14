"use client";

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

export type NavProjectsType = {
	title: string;
	link: {
		name: string;
		url: string;
		icon: React.ReactNode;
	}[];
};

export function NavProjects({ title, link }: NavProjectsType) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>{title}</SidebarGroupLabel>
			<SidebarMenu>
				{link.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton asChild>
							<a href={item.url}>
								{item.icon}
								<span>{item.name}</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
				{/*<SidebarMenuItem>
					<SidebarMenuButton className="text-sidebar-foreground/70">
						<MoreHorizontalIcon className="text-sidebar-foreground/70" />
						<span>More</span>
					</SidebarMenuButton>
				</SidebarMenuItem>*/}
			</SidebarMenu>
		</SidebarGroup>
	);
}
