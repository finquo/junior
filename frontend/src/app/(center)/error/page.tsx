"use client";

import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { supportEmailLink } from "@/lib/social";

export default function () {
	const params = useSearchParams();
	const error = params.get("error");
	const errorDescription = params.get("error_description");

	return (
		<Card>
			<CardHeader>
				<CardTitle>Something went wrong</CardTitle>
				<CardDescription>
					We encountered an unexpected error. Please try again or return to the
					home page.
				</CardDescription>
			</CardHeader>
			{(error || errorDescription) && (
				<CardContent>
					<Alert variant="destructive">
						<AlertCircleIcon />
						<AlertTitle>Error Reason</AlertTitle>
						{error && (
							<AlertDescription>{error.replaceAll("_", " ")}</AlertDescription>
						)}
						{errorDescription && (
							<AlertDescription>
								{errorDescription.replaceAll("_", " ")}
							</AlertDescription>
						)}
					</Alert>
				</CardContent>
			)}
			<CardFooter className="flex-wrap gap-2">
				<Button
					className="grow"
					variant={"secondary"}
					render={<Link href={`mailto:${supportEmailLink}`} />}
					nativeButton={false}
				>
					Contact Support
				</Button>
				<Button
					className="grow"
					render={<Link href={"/"} />}
					nativeButton={false}
				>
					Go to Homepage
				</Button>
			</CardFooter>
		</Card>
	);
}
