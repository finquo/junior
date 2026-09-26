"use client";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";

export type NavMainType = {
	title: string;
	items: {
		title: string;
		url: string;
		icon?: React.ReactNode;
		isActive?: boolean;
		fallbackItems?: {
			title: string;
			url: string;
		}[];
		items?: {
			title: string;
			url: string;
		}[];
	}[];
};

export function NavMain({ title, items }: NavMainType) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>{title}</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						defaultOpen={item.isActive}
						className="group/collapsible"
						render={<SidebarMenuItem />}
					>
						<SidebarMenuButton
							tooltip={item.title}
							render={<CollapsibleTrigger />}
						>
							<Link href={item.url as "/"}>{item.icon}</Link>
							<span>{item.title}</span>

							<Button
								className={"ml-auto"}
								variant={"outline"}
								size={"icon-xs"}
							>
								<ChevronRightIcon className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
							</Button>
						</SidebarMenuButton>
						<CollapsibleContent>
							<SidebarMenuSub>
								{item.fallbackItems?.map((subItem) => (
									<SidebarMenuSubItem key={subItem.title}>
										<SidebarMenuSubButton render={<a href={subItem.url} />}>
											<span>{subItem.title}</span>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								))}
								{item.items?.map((subItem) => (
									<SidebarMenuSubItem key={subItem.title}>
										<SidebarMenuSubButton render={<a href={subItem.url} />}>
											<span>{subItem.title}</span>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								))}
							</SidebarMenuSub>
						</CollapsibleContent>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
