"use client";

import { useQuery } from "@tanstack/react-query";
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
import type { api } from "@/hooks/api";
import { Button } from "./ui/button";

export type NavMainType = {
	title: string;
	items: {
		title: string;
		url: string;
		icon?: React.ReactNode;
		isActive?: boolean;
		fetchItems?: FetchItemsType;
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
							<div>
								<Button
									className={"ml-auto"}
									variant={"outline"}
									size={"icon-xs"}
								>
									<ChevronRightIcon className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
								</Button>
							</div>
						</SidebarMenuButton>
						<CollapsibleContent>
							<SidebarMenuSub>
								{item.items?.map((subItem) => (
									<SidebarMenuSubItem key={subItem.title}>
										<SidebarMenuSubButton render={<a href={subItem.url} />}>
											<span>{subItem.title}</span>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								))}
								{item.fetchItems && <FetchSideBarItems {...item.fetchItems} />}
							</SidebarMenuSub>
						</CollapsibleContent>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}

type FetchItemsType = {
	api: ReturnType<typeof api.sidebar.example.queryOptions>;
	getLink: (id: string) => string;
};

const FetchSideBarItems = ({ api, getLink }: FetchItemsType) => {
	const { data, isPending } = useQuery(api);

	if (isPending)
		return (
			<SidebarMenuSubItem>
				<SidebarMenuSubButton className="animate-pulse">
					<span>Loading...</span>
				</SidebarMenuSubButton>
			</SidebarMenuSubItem>
		);

	return data?.map((subItem) => (
		<SidebarMenuSubItem key={subItem.title}>
			<SidebarMenuSubButton render={<a href={getLink(subItem.id)} />}>
				<span>{subItem.title}</span>
			</SidebarMenuSubButton>
		</SidebarMenuSubItem>
	));
};
