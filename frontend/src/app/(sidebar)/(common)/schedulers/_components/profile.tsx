"use client";

import {
	CalendarIcon,
	MailIcon,
	PenIcon,
	ShieldCheckIcon,
	UserRoundIcon,
	VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserEditDrawer } from "@/components/user-edit-drawer";
import { RenderWhenRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";
import { formatDate, getInitials, snakeToTitleCase } from "@/lib/utils";

type SchedulerData = NonNullable<API_Returns["core"]["scheduler"]["get"]>;

export function SchedulerProfile({ data }: { data: SchedulerData }) {
	const user = data.user;

	return (
		<Card>
			<CardHeader>
				<Avatar size="lg">
					{user?.image && <AvatarImage src={user.image} alt={user.name} />}
					<AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
				</Avatar>
				<CardTitle>{user?.name ?? "Scheduler"}</CardTitle>
				<CardDescription>{user?.email}</CardDescription>
				<ColorBadge variant="info" className="col-span-full">
					Scheduler
				</ColorBadge>
				{user?.role && (
					<ColorBadge variant="secondary" className="col-span-full">
						{snakeToTitleCase(user.role)}
					</ColorBadge>
				)}
				{user?.banned && (
					<ColorBadge variant="destructive" className="col-span-full">
						Banned
					</ColorBadge>
				)}

				<CardAction>
					<ButtonGroup>
						<Button variant="outline" size="sm" asChild>
							<Link
								href={{
									pathname: "/slots/new",
									query: { schedulerId: data.id },
								}}
							>
								<VideoIcon />
								Schedule Session
							</Link>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link href="/slots">
								<CalendarIcon />
								View Sessions
							</Link>
						</Button>
						<RenderWhenRole role="admin">
							<UserEditDrawer userId={data.id} userData={user}>
								<Button variant="outline" size="sm">
									<PenIcon />
									Edit User
								</Button>
							</UserEditDrawer>
						</RenderWhenRole>
					</ButtonGroup>
				</CardAction>
			</CardHeader>

			<CardContent>
				<Tabs defaultValue="account">
					<TabsList>
						<TabsTrigger value="account">
							<UserRoundIcon />
							Account
						</TabsTrigger>
						<TabsTrigger value="permissions">
							<ShieldCheckIcon />
							Permissions
						</TabsTrigger>
					</TabsList>

					<TabsContent value="account" className="flex flex-col gap-4">
						{user?.banned && (
							<Alert variant="destructive">
								<AlertTitle>This account is banned</AlertTitle>
								<AlertDescription>
									{user.banReason ? `Reason: ${user.banReason}. ` : ""}
									{user.banExpires
										? `Expires: ${formatDate(user.banExpires)}`
										: "Permanent"}
								</AlertDescription>
							</Alert>
						)}

						<Card size="sm">
							<CardHeader>
								<CardTitle>Account Details</CardTitle>
								<CardDescription>
									Scheduler identity and account timeline.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ItemGroup>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<UserRoundIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Full Name</ItemTitle>
											<ItemDescription>
												{user?.name ?? "Unknown"}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<MailIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Email</ItemTitle>
											<ItemDescription>
												{user?.email ?? "Unknown"}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<CalendarIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Joined</ItemTitle>
											<ItemDescription>
												{formatDate(data.createdAt)}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<CalendarIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Last Updated</ItemTitle>
											<ItemDescription>
												{formatDate(data.updatedAt)}
											</ItemDescription>
										</ItemContent>
									</Item>
								</ItemGroup>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="permissions" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Role & Access</CardTitle>
								<CardDescription>
									Schedulers coordinate sessions and teacher assignments.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ItemGroup>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<ShieldCheckIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Role</ItemTitle>
											<ItemDescription>
												{snakeToTitleCase(user?.role ?? "scheduler")}
											</ItemDescription>
										</ItemContent>
										<Badge variant="secondary">Scheduler</Badge>
									</Item>
								</ItemGroup>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
