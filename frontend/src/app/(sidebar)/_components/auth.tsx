"use client";

import type { USER } from "backend/auth";
import { ErrorAuthCardFooter } from "@/app/_components/login";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/auth";

export function GetAuthLayout(role: NonNullable<USER["role"]>) {
	function Layout({ children }: { children: React.ReactNode }) {
		const { data, isPending } = useAuth();

		if (isPending)
			return (
				<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
					<div className="grid auto-rows-min gap-4 md:grid-cols-3">
						<Skeleton className="aspect-video rounded-xl" />
						<Skeleton className="aspect-video rounded-xl" />
						<Skeleton className="aspect-video rounded-xl" />
					</div>
					<Skeleton className="flex-1 rounded-xl md:min-h-min" />
				</div>
			);

		if (!data)
			return (
				<div className="flex flex-1 flex-col items-center justify-center">
					<Card>
						<CardHeader>
							<CardTitle>Not Authenticated</CardTitle>
							<CardDescription>
								Please login to access this page.
							</CardDescription>
						</CardHeader>
						<ErrorAuthCardFooter />
					</Card>
				</div>
			);

		if (data.role !== role)
			return (
				<div className="flex flex-1 flex-col items-center justify-center">
					<Card>
						<CardHeader>
							<CardTitle>Not Authorized</CardTitle>
							<CardDescription>
								Please login as {role} to access this page.
							</CardDescription>
						</CardHeader>
						<ErrorAuthCardFooter />
					</Card>
				</div>
			);

		return children;
	}

	return Layout;
}
