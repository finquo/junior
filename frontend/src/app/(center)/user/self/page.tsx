"use client";

import Link from "next/link";
import { sileo as toast } from "sileo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemTitle,
} from "@/components/ui/item";
import { authClient, useAuth } from "@/hooks/auth";
import { getInitials } from "@/lib/utils";

export default function SelfPage() {
	const { user } = useAuth();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{user?.name}</CardTitle>
				<CardDescription>{user?.email}</CardDescription>
				<CardAction>
					<Avatar>
						<AvatarImage src={user?.image} alt={user?.name} />
						<AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
					</Avatar>
				</CardAction>
			</CardHeader>
			<CardContent>
				<ItemGroup>
					<Item size="xs">
						<ItemContent>
							<ItemTitle>Phone</ItemTitle>
							<ItemDescription>{user?.phoneNumber}</ItemDescription>
						</ItemContent>
					</Item>
					<Item size="xs">
						<ItemContent>
							<ItemTitle>Role</ItemTitle>
							<ItemDescription>{user?.role}</ItemDescription>
						</ItemContent>
					</Item>
				</ItemGroup>
			</CardContent>
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
					variant="destructive"
				>
					Logout
				</Button>
				<ButtonGroup>
					<Button asChild variant="outline">
						<Link href="/user/edit">Edit Profile</Link>
					</Button>
				</ButtonGroup>
			</CardFooter>
		</Card>
	);
}
