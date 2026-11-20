"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Aurora from "@/components/bits/aurora";
import { Container } from "@/components/container";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";
import { StudentDock } from "./_components/dock";

function AuthError({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	const pathname = usePathname();
	const loginHref = `/login?redirect_to=${encodeURIComponent(pathname)}`;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardFooter className="justify-end">
				<Button asChild variant="secondary">
					<Link href="/">Go to Home</Link>
				</Button>
				<Button asChild>
					<Link href={loginHref as "/"}>Go to Login</Link>
				</Button>
			</CardFooter>
		</Card>
	);
}

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
				<AuthError
					title="Not Authenticated"
					description="Please login to access this page."
				/>
			</Container>
		);

	if (data.role !== "student")
		return (
			<Container>
				<AuthError
					title="Not Authorized"
					description="Please login as a student to access this page."
				/>
			</Container>
		);

	return (
		<>
			<Container className="lg:min-w-lg xl:min-w-xl 2xl:min-w-2xl">
				{children}
			</Container>
			<StudentDock />
			<div className="fixed -z-10 h-screen w-screen">
				<Aurora
					colorStops={["#3b68fc", "#09b1bb", "#714ade"]}
					// colorStops={["#09b1bb", "#fdae27", "#f8721f"]}
					// colorStops={["#714ade", "#09b1bb", "#f8721f"]}
					amplitude={1}
					blend={0.5}
					height={0.5}
					speed={2}
					glow={0.3}
					scale={1.15}
					brightness={1}
					layers={1}
					direction="bottom"
					opacity={1}
					mouseInteraction
					intro
					lightMode={false}
				/>
			</div>
		</>
	);
}
