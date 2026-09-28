import { ErrorAuthCardFooter } from "@/app/_components/login";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center">
			<Card>
				<CardHeader>
					<CardTitle>Not Found</CardTitle>
					<CardDescription>This page could not be found.</CardDescription>
				</CardHeader>
				<ErrorAuthCardFooter link="/me" label="My Profile" />
			</Card>
		</div>
	);
}
