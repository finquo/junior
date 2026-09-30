import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function () {
	return (
		<Card>
			<CardHeader>
				<CardTitle>You account haven't created fully</CardTitle>
				<CardDescription>
					Please wait or contact admin for assign you a proper role
				</CardDescription>
			</CardHeader>
			<CardFooter className="justify-between">
				<Button variant={"destructive"}>Logout</Button>
				<Button render={<Link href={"/me"} />}>Refresh</Button>
			</CardFooter>
		</Card>
	);
}
