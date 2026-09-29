"use client";

import { usePathname } from "next/navigation";
import React, { Suspense } from "react";
import { CopyButton } from "@/components/copy";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ImpersonationHeader } from "@/hooks/admin";
import { getClientBaseUrl } from "@/hooks/url";

export function SideBarHeader() {
	return (
		<header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
			<div className="flex items-center gap-2">
				<SidebarTrigger />
				<Separator
					orientation="vertical"
					className="data-vertical:h-4 data-vertical:self-auto"
				/>
				<Suspense>
					<Bread />
				</Suspense>
			</div>
			<ImpersonationHeader />
		</header>
	);
}

const Bread = () => {
	const pathname = usePathname();
	const segments = pathname.split("/").filter(Boolean);
	return (
		<Breadcrumb>
			<BreadcrumbList>
				{segments.map((segment, index) => {
					const isLast = index === segments.length - 1;
					const href = `/${segments.slice(0, index + 1).join("/")}`;
					const formatted = segment.charAt(0).toUpperCase() + segment.slice(1);

					return (
						<React.Fragment key={href}>
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage>{formatted}</BreadcrumbPage>
								) : (
									<BreadcrumbLink className="hidden md:block" href={href}>
										{formatted}
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{!isLast && <BreadcrumbSeparator className="hidden md:block" />}
						</React.Fragment>
					);
				})}
				<Separator
					orientation="vertical"
					className="mx-2 hidden data-vertical:h-4 data-vertical:self-auto md:block"
				/>
				<CopyButton
					size={"icon-xs"}
					variant={"ghost"}
					className="hidden md:block"
					text={() => getClientBaseUrl(pathname)}
					label="Link"
				/>
			</BreadcrumbList>
		</Breadcrumb>
	);
};
