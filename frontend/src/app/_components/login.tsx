"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

export function ErrorAuthCardFooter(props?: {
	link?: string;
	label?: string;
	children?: React.ReactNode;
}) {
	const pathname = usePathname();
	return (
		<CardFooter>
			<Button asChild className="flex-1" variant={"secondary"}>
				<Link href={"/"}>Go to Home</Link>
			</Button>
			<Button className="flex-1" asChild>
				<Link
					href={
						(props?.link as "/") ??
						`/login?redirect_to=${encodeURIComponent(pathname)}`
					}
				>
					Go to {props?.label ?? "Login"}
				</Link>
			</Button>
			{props?.children}
		</CardFooter>
	);
}
