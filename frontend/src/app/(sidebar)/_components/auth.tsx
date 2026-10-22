"use client";

import type { USER } from "backend/auth";
import { sileo as toast } from "sileo";
import { ErrorAuthCardFooter } from "@/app/_components/login";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient, useAuth } from "@/hooks/auth";

export function GetAuthLayout(role: NonNullable<USER["role"]>) {
	function Layout({ children }: { children: React.ReactNode }) {
		const { data, isPending, impersonation } = useAuth();

		if (isPending)
			return (
				<div className="flex h-svh flex-1 flex-col gap-4 p-4">
					<div className="grid auto-rows-min gap-4 md:grid-cols-3">
						<Skeleton className="aspect-video" />
						<Skeleton className="aspect-video" />
						<Skeleton className="aspect-video" />
					</div>
					<Skeleton className="flex-1" />
					<div className="grid auto-rows-min gap-4 md:grid-cols-3">
						<Skeleton className="aspect-video" />
						<Skeleton className="aspect-video" />
						<Skeleton className="aspect-video" />
					</div>
				</div>
			);

		if (!data?.role)
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
						<ErrorAuthCardFooter label={"My Profile"} link={"/me"}>
							{impersonation && (
								<Button
									variant={"destructive"}
									onClick={async () =>
										await authClient.admin.stopImpersonating(
											{},
											{
												throw: true,
												onSuccess: () => {
													toast.success({
														title: "You’re back to your role",
													});
												},
											},
										)
									}
								>
									Stop Impersonating
								</Button>
							)}
						</ErrorAuthCardFooter>
					</Card>
				</div>
			);

		return children;
	}

	return Layout;
}

export function GetAuthsLayout(roles: NonNullable<USER["role"]>[]) {
	function Layout({ children }: { children: React.ReactNode }) {
		const { data, isPending } = useAuth();

		if (isPending)
			return (
				<div className="flex h-svh flex-1 flex-col gap-4 p-4">
					<div className="grid auto-rows-min gap-4 md:grid-cols-3">
						<Skeleton className="aspect-video" />
						<Skeleton className="aspect-video" />
						<Skeleton className="aspect-video" />
					</div>
					<Skeleton className="flex-1" />
					<div className="grid auto-rows-min gap-4 md:grid-cols-3">
						<Skeleton className="aspect-video" />
						<Skeleton className="aspect-video" />
						<Skeleton className="aspect-video" />
					</div>
				</div>
			);

		if (!data?.role)
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

		if (roles.some((r) => r === data.role)) return children;

		return (
			<div className="flex flex-1 flex-col items-center justify-center">
				<Card>
					<CardHeader>
						<CardTitle>Not Authorized</CardTitle>
						<CardDescription>
							Please login as {roles.join(", ")} to access this page.
						</CardDescription>
					</CardHeader>
					<ErrorAuthCardFooter label={"My Profile"} link={"/me"} />
				</Card>
			</div>
		);
	}

	return Layout;
}
