"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sileo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/hooks/api";
import { ThemeProvider } from "./theme-provider";

function ThemedToaster() {
	const { resolvedTheme } = useTheme();

	return (
		<Toaster
			theme={resolvedTheme === "dark" ? "dark" : "light"}
			position="top-center"
		/>
	);
}

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<QueryClientProvider client={queryClient}>
				<TooltipProvider delayDuration={400}>
					<NuqsAdapter>{children}</NuqsAdapter>
				</TooltipProvider>
				<ThemedToaster />
			</QueryClientProvider>
		</ThemeProvider>
	);
}
