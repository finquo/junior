"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

export function ErrorAuthCardFooter() {
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
					<Link href={`/login?redirect_to=${encodeURIComponent(pathname)}`} />
				}
			>
				Go to Login
			</Button>
		</CardFooter>
	);
}
