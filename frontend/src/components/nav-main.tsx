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
		subItems?: {
			icon?: React.ReactNode;
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
						asChild
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={item.title}>
									<Link href={item.url as "/"}>{item.icon}</Link>
									<span>{item.title}</span>
									<Button
										disabled={
											(!item.subItems || item.subItems.length === 0) &&
											!item.fetchItems
										}
										className={"ml-auto"}
										variant={"outline"}
										size={"icon-xs"}
										asChild
									>
										<div>
											<ChevronRightIcon className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
										</div>
									</Button>
								</SidebarMenuButton>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub>
									{item.subItems?.map((subItem) => (
										<SidebarMenuSubItem key={subItem.title}>
											<SidebarMenuSubButton asChild>
												<a href={subItem.url}>
													{subItem.icon}
													<span>{subItem.title}</span>
												</a>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									))}
									{item.fetchItems && (
										<FetchSideBarItems {...item.fetchItems} />
									)}
								</SidebarMenuSub>
							</CollapsibleContent>
						</SidebarMenuItem>
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

	const items = data as
		| Awaited<ReturnType<FetchItemsType["api"]["queryFn"]>>
		| undefined;

	return items?.map((subItem) => (
		<SidebarMenuSubItem key={subItem.title}>
			<SidebarMenuSubButton asChild>
				<Link href={getLink(subItem.id) as "/"}>
					<span>{subItem.title}</span>
				</Link>
			</SidebarMenuSubButton>
		</SidebarMenuSubItem>
	));
};
