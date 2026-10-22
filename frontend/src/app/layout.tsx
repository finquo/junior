import Providers from "@/components/providers";
import PwaRegistration from "@/components/pwa-registration";
import "@/index.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "app",
	description: "app",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			data-theme="dark"
			data-accent="violet"
			lang="en"
			suppressHydrationWarning
			className={cn("font-sans", inter.variable)}
		>
			<body>
				<PwaRegistration />

				<Providers>
					<div className="grid min-h-svh grid-rows-[1fr]">
						<Suspense>{children}</Suspense>
					</div>
				</Providers>
			</body>
		</html>
	);
}
