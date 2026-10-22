"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { langFlag, langName } from "language-emoji";
import {
	CalendarIcon,
	GraduationCapIcon,
	LanguagesIcon,
	MapPinIcon,
	UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import Loader from "@/components/loader";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { getInitials, snakeToTitleCase } from "@/lib/utils";

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

	return (
		<Frame spacing="sm">
			<FramePanel>
				<Item>
					<ItemMedia>
						<Avatar size="lg">
							<AvatarImage src={user.image} alt={user.name} />
							<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
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
						<Button asChild variant="outline" size="sm">
							<Link href="/student/edit">Edit</Link>
						</Button>
					</ItemActions>
				</Item>
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Details</FrameTitle>
					<FrameDescription>What your student record holds</FrameDescription>
				</FrameHeader>
				<ItemGroup>
					<Item variant="outline">
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
							<Button asChild variant="outline" size="sm">
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

					{student.schooling && (
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
					)}

					{languages.length > 0 && (
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
					)}

					{address && (
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
					)}

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
			</FramePanel>
		</Frame>
	);
}
