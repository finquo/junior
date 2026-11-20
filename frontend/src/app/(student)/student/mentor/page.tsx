"use client";

import { useQuery } from "@tanstack/react-query";
import { type Availability, dayKeys } from "backend/config";
import { format } from "date-fns";
import { langFlag, langName } from "language-emoji";
import { BriefcaseBusinessIcon, PhoneIcon } from "lucide-react";
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
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
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

function ExperienceDialog({ mentorId }: { mentorId: string }) {
	const { data: mentor } = useQuery(
		api.common.getUser.queryOptions({ input: { id: mentorId } }),
	);
	const experiences = mentor?.teacherData?.experiences ?? [];

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="secondary" size="sm">
					Experience
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Experience</DialogTitle>
					<DialogDescription>Where your mentor has taught</DialogDescription>
				</DialogHeader>
				{experiences.length > 0 ? (
					<ItemGroup>
						{experiences.map((experience) => (
							<Item
								key={`${experience.title}-${experience.startedAt}`}
								variant="outline"
							>
								<ItemMedia variant="icon">
									<BriefcaseBusinessIcon />
								</ItemMedia>
								<ItemContent>
									<ItemTitle>{experience.title}</ItemTitle>
									<ItemDescription>
										{experience.organization} ·{" "}
										{format(new Date(experience.startedAt), "MMM yyyy")} –{" "}
										{experience.endedAt
											? format(new Date(experience.endedAt), "MMM yyyy")
											: "Present"}
									</ItemDescription>
									{experience.description ? (
										<ItemDescription>{experience.description}</ItemDescription>
									) : null}
								</ItemContent>
							</Item>
						))}
					</ItemGroup>
				) : (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No experience listed</EmptyTitle>
							<EmptyDescription>
								Your mentor has not added any experience yet.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
				<DialogFooter>
					<DialogClose asChild>
						<Button variant="secondary">Close</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function MentorProfile({ mentorId }: { mentorId: string }) {
	const {
		data: mentor,
		isPending,
		isError,
	} = useQuery(api.common.getUser.queryOptions({ input: { id: mentorId } }));

	if (isPending) return <Skeleton className="h-40 w-full" />;

	if (isError || !mentor) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Mentor Unavailable</AlertTitle>
				<AlertDescription>
					Your mentor profile could not be loaded.
				</AlertDescription>
			</Alert>
		);
	}

	const languages = mentor.teacherData?.languages ?? [];
	const availability: Partial<Availability> =
		mentor.teacherData?.availability ?? {};
	const availableDays = dayKeys.filter((day) => availability[day]?.enabled);
	const mentorFallback = mentor.name.trim().charAt(0).toUpperCase() || "M";

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<CardTitle>My Mentor</CardTitle>
					<CardDescription>
						A person who you can trust with your doubts
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Item>
						<ItemMedia>
							<Avatar size="lg">
								<AvatarImage src={mentor.image} alt={mentor.name} />
								<AvatarFallback>{mentorFallback}</AvatarFallback>
							</Avatar>
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								<span>{mentor.name}</span>
								<Badge variant="secondary">Mentor</Badge>
							</ItemTitle>
							<ItemDescription>{mentor.email}</ItemDescription>
						</ItemContent>
						{languages.length > 0 ? (
							<ItemContent>
								{languages.map((language) => (
									<Badge key={language} variant="secondary">
										{langFlag(language)} {langName(language)}
									</Badge>
								))}
							</ItemContent>
						) : null}
						<ItemActions>
							<ExperienceDialog mentorId={mentor.id} />
						</ItemActions>
					</Item>
					{mentor.phoneNumber ? (
						<Item variant="outline">
							<ItemMedia variant="icon">
								<PhoneIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Phone</ItemTitle>
								<ItemDescription>{mentor.phoneNumber}</ItemDescription>
							</ItemContent>
							<ItemActions>
								<Button asChild variant="secondary" size="sm">
									<a href={`tel:${mentor.phoneNumber}`}>
										<PhoneIcon />
										Call
									</a>
								</Button>
							</ItemActions>
						</Item>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Availability</CardTitle>
					<CardDescription>When your mentor is available</CardDescription>
				</CardHeader>
				<CardContent>
					{availableDays.length > 0 ? (
						<ItemGroup>
							{availableDays.map((day) => (
								<Item key={day} variant="muted">
									<ItemContent>
										<ItemTitle>
											{day.charAt(0).toUpperCase() + day.slice(1)}
										</ItemTitle>
										<ItemDescription>
											{availability[day]?.ranges
												.map((range) => `${range.start} – ${range.end}`)
												.join(", ")}
										</ItemDescription>
									</ItemContent>
								</Item>
							))}
						</ItemGroup>
					) : (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No availability set</EmptyTitle>
								<EmptyDescription>
									Your mentor has not set their availability yet.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function Mentor({ mentorId }: { mentorId: string | null }) {
	if (!mentorId) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<BriefcaseBusinessIcon />
					</EmptyMedia>
					<EmptyTitle>No mentor assigned</EmptyTitle>
					<EmptyDescription>
						Your mentor will appear here once one has been assigned to you.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return <MentorProfile mentorId={mentorId} />;
}

export default function Page() {
	const {
		data: student,
		isPending,
		isError,
	} = useQuery(api.core.self.student.queryOptions());

	if (isPending) return <Loader />;

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

	return <Mentor mentorId={student.mentorId} />;
}
