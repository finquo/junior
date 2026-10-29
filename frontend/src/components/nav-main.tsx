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
				{items.map((item) => {
					const expandable =
						Boolean(item.subItems?.length) || Boolean(item.fetchItems);

					const label = (
						<>
							{item.icon}
							<span>{item.title}</span>
						</>
					);

					return (
						<Collapsible
							key={item.title}
							defaultOpen={item.isActive}
							className="group/collapsible"
							asChild
						>
							<SidebarMenuItem>
								<CollapsibleTrigger asChild>
									<SidebarMenuButton tooltip={item.title}>
										{expandable ? (
											label
										) : (
											<Link
												href={item.url as "/"}
												className="flex items-center"
											>
												{label}
											</Link>
										)}
										{expandable && (
											<span className="ml-auto">
												<ChevronRightIcon className="transition-transform duration-200 group-data-open/collapsible:rotate-90" />
											</span>
										)}
									</SidebarMenuButton>
								</CollapsibleTrigger>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.subItems?.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton asChild>
													<Link href={subItem.url as "/"}>
														{subItem.icon}
														<span>{subItem.title}</span>
													</Link>
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
					);
				})}
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
