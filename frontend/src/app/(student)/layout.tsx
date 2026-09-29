"use client";

import { Container } from "@/components/container";
import Loader from "@/components/loader";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/auth";
import { ErrorAuthCardFooter } from "../_components/login";
import { SideBarHeader } from "../(sidebar)/_components/header";
import { SidebarConfig } from "./_components/sidebar";

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { data, isPending } = useAuth();

	if (isPending) return <Loader />;

	if (!data)
		return (
			<Container>
				<Card>
					<CardHeader>
						<CardTitle>Not Authenticated</CardTitle>
						<CardDescription>Please login to access this page.</CardDescription>
					</CardHeader>
					<ErrorAuthCardFooter />
				</Card>
			</Container>
		);

	if (data.role !== "student")
		return (
			<Container>
				<Card>
					<CardHeader>
						<CardTitle>Not Authorized</CardTitle>
						<CardDescription>
							Please login as a student to access this page.
						</CardDescription>
					</CardHeader>
					<ErrorAuthCardFooter />
				</Card>
			</Container>
		);

	return (
		<SidebarProvider>
			<SidebarConfig />
			<SidebarInset>
				<SideBarHeader />
				<div className="p-3">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
