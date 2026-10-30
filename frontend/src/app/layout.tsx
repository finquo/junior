import Providers from "@/components/providers";
import PwaRegistration from "@/components/pwa-registration";
import "@/index.css";
import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

const outfitHeading = Outfit({
	subsets: ["latin"],
	variable: "--font-heading",
});

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

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
			className={cn("font-sans", dmSans.variable, outfitHeading.variable)}
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
