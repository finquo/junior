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
import { useRouter } from "next/navigation";
import { Alert } from "@/components/arc/alert/alert";
import { Avatar } from "@/components/arc/avatar/avatar";
import { Badge } from "@/components/arc/badge/badge";
import { Button as ArcButton } from "@/components/arc/button/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/arc/card/card";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/arc/item/item";
import { Skeleton } from "@/components/arc/skeleton/skeleton";
import Loader from "@/components/loader";
import { api } from "@/hooks/api";
import { useAuth } from "@/hooks/auth";
import { FetchUser } from "@/hooks/user";
import { snakeToTitleCase } from "@/lib/utils";

export default function Page() {
	const router = useRouter();
	const { data: user } = useAuth<true>();
	const {
		data: student,
		isPending,
		isError,
	} = useQuery(api.core.self.student.queryOptions());

	if (isPending || !user) return <Loader />;

	if (isError || !student) {
		return (
			<Alert tone="danger" title="Profile Unavailable">
				Your student profile could not be loaded.
			</Alert>
		);
	}

	const address = student.address;
	const languages = student.languages ?? [];

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
							<Avatar
								name={user.name}
								src={user.image ?? undefined}
								size="lg"
							/>
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								<span>{user.name}</span>
								<Badge tone="neutral">{snakeToTitleCase(user.role)}</Badge>
							</ItemTitle>
							<ItemDescription>{user.email}</ItemDescription>
						</ItemContent>
						<ItemActions>
							<ArcButton
								variant="secondary"
								size="sm"
								link="/student/edit"
								onClick={() => router.push("/student/edit")}
							>
								<UserPenIcon />
								Edit Profile
							</ArcButton>
							<ArcButton
								variant="secondary"
								size="sm"
								link="/student/edit/account"
								onClick={() => router.push("/user/edit")}
							>
								<PenIcon />
								Edit Account
							</ArcButton>
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
									isPending={<Skeleton lines={1} />}
									notFound={<ItemDescription>Not assigned</ItemDescription>}
								>
									{(mentor) => <ItemDescription>{mentor.name}</ItemDescription>}
								</FetchUser>
							</ItemContent>
							<ItemActions>
								<ArcButton
									variant="secondary"
									size="sm"
									link="/student/mentor"
									onClick={() => router.push("/student/mentor")}
								>
									View
								</ArcButton>
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
									isPending={<Skeleton lines={1} />}
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
										<Badge key={language} tone="neutral">
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
				</CardContent>
			</Card>
		</div>
	);
}
