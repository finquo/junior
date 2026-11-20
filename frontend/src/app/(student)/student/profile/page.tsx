"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { langFlag, langName } from "language-emoji";
import {
	CalendarIcon,
	GraduationCapIcon,
	LanguagesIcon,
	MapPinIcon,
	PenIcon,
	UserPenIcon,
	UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";
import { useAuth } from "@/hooks/auth";
import { FetchUser } from "@/hooks/user";
import { snakeToTitleCase } from "@/lib/utils";

export default function Page() {
	const { data: user } = useAuth<true>();
	const {
		data: student,
		isPending,
		isError,
	} = useQuery(api.core.self.student.queryOptions());

	if (isPending || !user) return <Loader />;

	if (isError || !student) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Profile Unavailable</AlertTitle>
				<AlertDescription>
					Your student profile could not be loaded.
				</AlertDescription>
			</Alert>
		);
	}

	const address = student.address;
	const languages = student.languages ?? [];
	const userFallback = user.name.trim().charAt(0).toUpperCase() || "U";

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>Details</CardTitle>
					<CardDescription>What your student record holds</CardDescription>
				</CardHeader>
				<CardContent>
					<Item>
						<ItemMedia>
							<Avatar size="lg">
								<AvatarImage src={user.image} alt={user.name} />
								<AvatarFallback>{userFallback}</AvatarFallback>
							</Avatar>
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								<span>{user.name}</span>
								<Badge variant="secondary">{snakeToTitleCase(user.role)}</Badge>
							</ItemTitle>
							<ItemDescription>{user.email}</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Button asChild variant="secondary" size="sm">
								<Link href="/student/edit">
									<UserPenIcon />
									Edit Profile
								</Link>
							</Button>
							<Button asChild variant="secondary" size="sm">
								<Link href={"/user/edit" as "/"}>
									<PenIcon />
									Edit Account
								</Link>
							</Button>
						</ItemActions>
					</Item>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<ItemGroup>
						<Item variant="muted">
							<ItemMedia variant="icon">
								<UserRoundIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Mentor</ItemTitle>
								<FetchUser
									id={student.mentorId}
									isPending={<Skeleton className="h-4 w-24" />}
									notFound={<ItemDescription>Not assigned</ItemDescription>}
								>
									{(mentor) => <ItemDescription>{mentor.name}</ItemDescription>}
								</FetchUser>
							</ItemContent>
							<ItemActions>
								<Button asChild variant="secondary" size="sm">
									<Link href="/student/mentor">View</Link>
								</Button>
							</ItemActions>
						</Item>

						<Item variant="outline">
							<ItemMedia variant="icon">
								<UserRoundIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Supervisor</ItemTitle>
								<FetchUser
									id={student.supervisorId}
									isPending={<Skeleton className="h-4 w-24" />}
									notFound={<ItemDescription>Not assigned</ItemDescription>}
								>
									{(supervisor) => (
										<ItemDescription>{supervisor.name}</ItemDescription>
									)}
								</FetchUser>
							</ItemContent>
						</Item>

						{student.schooling ? (
							<Item variant="outline">
								<ItemMedia variant="icon">
									<GraduationCapIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>Schooling</ItemTitle>
									<ItemDescription>
										{snakeToTitleCase(student.schooling)}
									</ItemDescription>
								</ItemContent>
							</Item>
						) : null}

						{languages.length > 0 ? (
							<Item variant="outline">
								<ItemMedia variant="icon">
									<LanguagesIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>Languages</ItemTitle>
								</ItemContent>
								<ItemActions>
									{languages.map((language) => (
										<Badge key={language} variant="secondary">
											{langFlag(language)} {langName(language)}
										</Badge>
									))}
								</ItemActions>
							</Item>
						) : null}

						{address ? (
							<Item variant="outline">
								<ItemMedia variant="icon">
									<MapPinIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>Address</ItemTitle>
									<ItemDescription>
										{[
											address.line1,
											address.line2,
											address.city,
											address.state,
											address.postalCode,
											address.country,
										]
											.filter(Boolean)
											.join(", ")}
									</ItemDescription>
								</ItemContent>
							</Item>
						) : null}

						<Item variant="outline">
							<ItemMedia variant="icon">
								<CalendarIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Member Since</ItemTitle>
								<ItemDescription>
									{format(new Date(student.createdAt), "MMMM d, yyyy")}
								</ItemDescription>
							</ItemContent>
						</Item>
					</ItemGroup>
				</CardContent>
			</Card>
		</div>
	);
}
