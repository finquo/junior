"use client";

import {
	ArrowRightIcon,
	FolderIcon,
	MoreHorizontalIcon,
	Trash2Icon,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
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
	const { isMobile } = useSidebar();
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>{title}</SidebarGroupLabel>
			<SidebarMenu>
				{link.map((item) => (
					<SidebarMenuItem key={item.name}>
						<SidebarMenuButton render={<a href={item.url} />}>
							{item.icon}
							<span>{item.name}</span>
						</SidebarMenuButton>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<SidebarMenuAction
										showOnHover
										className="aria-expanded:bg-muted"
									/>
								}
							>
								<MoreHorizontalIcon />
								<span className="sr-only">More</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								className="w-fit"
								side={isMobile ? "bottom" : "right"}
								align={isMobile ? "end" : "start"}
							>
								<DropdownMenuItem>
									<FolderIcon />
									<span>View Link</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<ArrowRightIcon />
									<span>Share Link</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem variant="destructive">
									<Trash2Icon />
									<span>Delete Link</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				))}
				<SidebarMenuItem>
					<SidebarMenuButton className="text-sidebar-foreground/70">
						<MoreHorizontalIcon className="text-sidebar-foreground/70" />
						<span>More</span>
					</SidebarMenuButton>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarGroup>
	);
}
