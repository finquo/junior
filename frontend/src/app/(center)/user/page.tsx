"use client";

import Link from "next/link";
import { sileo as toast } from "sileo";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/hooks/auth";

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
				<Button
					onClick={async () =>
						await authClient.signOut(
							{},
							{
								throw: true,
								onSuccess: () => {
									toast.success({
										title: "You’re signed out",
									});
								},
							},
						)
					}
					variant={"destructive"}
				>
					Logout
				</Button>
				<ButtonGroup>
					<Button asChild variant={"outline"}>
						<Link href={"/user/edit"}>Edit Profile</Link>
					</Button>
					<Button asChild variant={"outline"}>
						<Link href={"/me"}>Refresh</Link>
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
