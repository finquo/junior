"use client";

import { Container } from "@/components/container";
import Loader from "@/components/loader";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";
import { ErrorAuthCardFooter } from "../_components/login";

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

	return <Container className="space-y-4">{children}</Container>;
}
