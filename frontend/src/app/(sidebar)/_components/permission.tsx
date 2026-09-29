"use client";

import type { Permissions } from "backend/auth";
import { ErrorAuthCardFooter } from "@/app/_components/login";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { usePermission } from "@/hooks/permission";

export function GetPermissionLayout<AC extends keyof Partial<Permissions>>(
	checkSector: AC,
	checkAction: Permissions[AC][number],
) {
	function Layout({ children }: { children: React.ReactNode }) {
		const { render, role } = usePermission(checkSector, checkAction);

		if (!render)
			return (
				<div className="flex flex-1 flex-col items-center justify-center">
					<Card>
						<CardHeader>
							<CardTitle>Not Authorized</CardTitle>
							<CardDescription>
								Please login as {role ?? "a valid user"} to access this page.
							</CardDescription>
						</CardHeader>
						<ErrorAuthCardFooter label={"My Profile"} link={"/me"} />
					</Card>
				</div>
			);

		return children;
	}

	return Layout;
}
