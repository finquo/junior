"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

export function ErrorAuthCardFooter(props?: { link?: string; label?: string }) {
	const pathname = usePathname();
	return (
		<CardFooter>
			<Button
				render={<Link href={"/"} />}
				className="flex-1"
				variant={"secondary"}
				nativeButton={false}
			>
				Go to Home
			</Button>
			<Button
				className="flex-1"
				nativeButton={false}
				render={
					<Link
						href={
							(props?.link as "/") ??
							`/login?redirect_to=${encodeURIComponent(pathname)}`
						}
					/>
				}
			>
				Go to {props?.label ?? "Login"}
			</Button>
		</CardFooter>
	);
}
