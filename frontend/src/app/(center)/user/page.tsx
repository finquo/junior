import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
				<ButtonGroup>
					<Button
						nativeButton={false}
						variant={"outline"}
						render={<Link href={"/user/edit"} />}
					>
						Edit Profile
					</Button>
					<Button
						nativeButton={false}
						variant={"outline"}
						render={<Link href={"/me"} />}
					>
						Refresh
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
