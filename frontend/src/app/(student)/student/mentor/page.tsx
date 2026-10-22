"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { langFlag, langName } from "language-emoji";
import { BriefcaseBusinessIcon } from "lucide-react";
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
import { getInitials } from "@/lib/utils";

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
	const experiences = mentor.teacherData?.experiences ?? [];

	return (
		<Frame spacing="sm">
			<FramePanel>
				<Item>
					<ItemMedia>
						<Avatar size="lg">
							<AvatarImage src={mentor.image} alt={mentor.name} />
							<AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
						</Avatar>
					</ItemMedia>
					<ItemContent>
						<ItemTitle>
							<span>{mentor.name}</span>
							<Badge variant="secondary">Mentor</Badge>
						</ItemTitle>
						<ItemDescription>{mentor.email}</ItemDescription>
					</ItemContent>
					{languages.length > 0 && (
						<ItemActions>
							{languages.map((language) => (
								<Badge key={language} variant="outline">
									{langFlag(language)} {langName(language)}
								</Badge>
							))}
						</ItemActions>
					)}
				</Item>
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Experience</FrameTitle>
					<FrameDescription>Where your mentor has taught</FrameDescription>
				</FrameHeader>
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
										<ItemDescription>{experience.description}</ItemDescription>
									)}
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
			</FramePanel>
		</Frame>
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
