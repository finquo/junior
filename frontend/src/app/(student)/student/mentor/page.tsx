"use client";

import { useQuery } from "@tanstack/react-query";
import { type Availability, dayKeys } from "backend/config";
import { format } from "date-fns";
import { langFlag, langName } from "language-emoji";
import { BriefcaseBusinessIcon, PhoneIcon } from "lucide-react";
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
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogInner,
	DialogTrigger,
} from "@/components/arc/dialog/dialog";
import { EmptyState } from "@/components/arc/empty-state/empty-state";
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

function ExperienceDialog({ mentorId }: { mentorId: string }) {
	const { data: mentor } = useQuery(
		api.common.getUser.queryOptions({ input: { id: mentorId } }),
	);
	const experiences = mentor?.teacherData?.experiences ?? [];

	return (
		<Dialog>
			<DialogTrigger asChild>
				<ArcButton variant="secondary" size="sm">
					Experience
				</ArcButton>
			</DialogTrigger>
			<DialogContent
				title="Experience"
				description="Where your mentor has taught"
			>
				<DialogInner>
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
										{experience.description && (
											<ItemDescription>
												{experience.description}
											</ItemDescription>
										)}
									</ItemContent>
								</Item>
							))}
						</ItemGroup>
					) : (
						<EmptyState
							title="No experience listed"
							description="Your mentor has not added any experience yet."
						/>
					)}
				</DialogInner>
				<DialogFooter>
					<DialogClose asChild>
						<ArcButton variant="secondary">Close</ArcButton>
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

	if (isPending) return <Skeleton lines={4} />;

	if (isError || !mentor) {
		return (
			<Alert tone="danger" title="Mentor Unavailable">
				Your mentor profile could not be loaded.
			</Alert>
		);
	}

	const languages = mentor.teacherData?.languages ?? [];
	const availability: Partial<Availability> =
		mentor.teacherData?.availability ?? {};
	const availableDays = dayKeys.filter((day) => availability[day]?.enabled);

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
							<Avatar
								name={mentor.name}
								src={mentor.image ?? undefined}
								size="lg"
							/>
						</ItemMedia>
						<ItemContent>
							<ItemTitle>
								<span>{mentor.name}</span>
								<Badge tone="neutral">Mentor</Badge>
							</ItemTitle>
							<ItemDescription>{mentor.email}</ItemDescription>
						</ItemContent>
						{languages.length > 0 && (
							<ItemContent>
								{languages.map((language) => (
									<Badge key={language} tone="neutral">
										{langFlag(language)} {langName(language)}
									</Badge>
								))}
							</ItemContent>
						)}
						<ItemActions>
							<ExperienceDialog mentorId={mentor.id} />
						</ItemActions>
					</Item>
					{mentor.phoneNumber && (
						<Item variant="outline">
							<ItemMedia variant="icon">
								<PhoneIcon />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>Phone</ItemTitle>
								<ItemDescription>{mentor.phoneNumber}</ItemDescription>
							</ItemContent>
							<ItemActions>
								<ArcButton
									variant="secondary"
									size="sm"
									link={`tel:${mentor.phoneNumber}`}
								>
									<PhoneIcon />
									Call
								</ArcButton>
							</ItemActions>
						</Item>
					)}
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
						<EmptyState
							title="No availability set"
							description="Your mentor has not set their availability yet."
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

function Mentor({ mentorId }: { mentorId: string | null }) {
	if (!mentorId) {
		return (
			<EmptyState
				icon={<BriefcaseBusinessIcon />}
				title="No mentor assigned"
				description="Your mentor will appear here once one has been assigned to you."
			/>
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
			<Alert tone="danger" title="Profile Unavailable">
				Your student profile could not be loaded.
			</Alert>
		);
	}

	return <Mentor mentorId={student.mentorId} />;
}
