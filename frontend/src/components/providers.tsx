"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sileo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/hooks/api";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<QueryClientProvider client={queryClient}>
				<TooltipProvider delay={400}>
					<NuqsAdapter>{children}</NuqsAdapter>
				</TooltipProvider>
			</QueryClientProvider>
			<Toaster theme="dark" position="top-center" />
		</ThemeProvider>
	);
}
