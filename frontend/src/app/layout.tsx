import Providers from "@/components/providers";
import PwaRegistration from "@/components/pwa-registration";
import "@/index.css";
import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { Suspense } from "react";
import { socials } from "@/lib/social";
import { cn } from "@/lib/utils";

const outfitHeading = Outfit({
	subsets: ["latin"],
	variable: "--font-heading",
});

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	metadataBase: new URL(socials.website),
	title: {
		default: socials.name,
		template: `%s | ${socials.name}`,
	},
	description: socials.description,
	applicationName: socials.name,
	icons: { icon: "/favicon.png" },
	keywords: [
		socials.name,
		socials.company,
		"learning management",
		"students",
		"teachers",
		"scheduling",
	],
	robots: { index: true, follow: true },
	openGraph: {
		type: "website",
		locale: "en_US",
		url: socials.website,
		siteName: socials.name,
		title: socials.name,
		description: socials.description,
	},
	twitter: {
		card: "summary_large_image",
		title: socials.name,
		description: socials.description,
	},
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
