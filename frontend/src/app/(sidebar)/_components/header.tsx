"use client";

import { usePathname } from "next/navigation";
import React, { Suspense } from "react";
import { CopyButton } from "@/components/copy";
import { ModeToggle } from "@/components/mode-toggle";
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
import { truncateText } from "@/lib/utils";

export function SideBarHeader() {
	return (
		<header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
			<div className="flex items-center gap-2">
				<SidebarTrigger />
				<Separator orientation="vertical" />
				<Suspense>
					<Bread />
				</Suspense>
			</div>
			<ImpersonationHeader />
			<ModeToggle />
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
					const formatted = truncateText(
						segment.charAt(0).toUpperCase() + segment.slice(1),
						15,
					);

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
				<Separator orientation="vertical" className="mx-2 hidden md:block" />
				<CopyButton
					size={"icon-sm"}
					variant={"secondary"}
					className="hidden md:flex"
					text={() => getClientBaseUrl(pathname)}
					label="Link"
				/>
			</BreadcrumbList>
		</Breadcrumb>
	);
};
