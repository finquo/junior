"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button as ArcButton } from "@/components/arc/button/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/arc/card/card";
import { Container } from "@/components/container";
import Loader from "@/components/loader";
import { useAuth } from "@/hooks/auth";
import { StudentDock } from "./_components/dock";
import "@/components/arc/foundation.css";
import Aurora from "@/components/bits/aurora";

function AuthError({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const loginHref = `/login?redirect_to=${encodeURIComponent(pathname)}`;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardFooter style={{ justifyContent: "flex-end" }}>
				<ArcButton
					variant="secondary"
					link="/"
					onClick={() => router.push("/")}
				>
					Go to Home
				</ArcButton>
				<ArcButton
					link={loginHref}
					onClick={() => router.push(loginHref as "/")}
				>
					Go to Login
				</ArcButton>
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
					colorStops={["#5227FF", "#7cff67", "#5227FF"]}
					amplitude={1.05}
					blend={0.5}
					height={0.53}
					speed={1.65}
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
