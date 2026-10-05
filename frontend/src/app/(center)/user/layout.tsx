"use client";

import { ErrorAuthCardFooter } from "@/app/_components/login";
import Loader from "@/components/loader";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";

export default function Layout({ children }: { children: React.ReactNode }) {
	const { data, isPending } = useAuth();

	if (isPending) return <Loader />;

	if (!data?.role)
		return (
			<Card>
				<CardHeader>
					<CardTitle>Not Authenticated</CardTitle>
					<CardDescription>Please login to access this page.</CardDescription>
				</CardHeader>
				<ErrorAuthCardFooter />
			</Card>
		);

	return children;
}
