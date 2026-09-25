import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { supportEmailLink } from "@/lib/social";

export default function () {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Something went wrong</CardTitle>
				<CardDescription>
					We encountered an unexpected error. Please try again or return to the
					home page.
				</CardDescription>
			</CardHeader>

			<CardFooter className="flex-wrap gap-2">
				<Button
					className="grow"
					variant={"secondary"}
					render={<Link href={`mailto:${supportEmailLink}`} />}
				>
					Contact Support
				</Button>
				<Button className="grow" render={<Link href={"/"} />}>
					Go to Homepage
				</Button>
			</CardFooter>
		</Card>
	);
}
