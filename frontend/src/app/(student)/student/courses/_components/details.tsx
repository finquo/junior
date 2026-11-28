import { langFlag, langName } from "language-emoji";
import { GraduationCapIcon, VideoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
	ItemActions,
	ItemContent,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import type { API_Returns } from "@/lib/api";

type Course = NonNullable<API_Returns["student"]["getCourseMeta"]>;

export function Details({ course }: { course: Course }) {
	const language = `${langFlag(course.language)} ${langName(course.language)}`;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{course.name}</CardTitle>
				{course.description ? (
					<CardDescription>{course.description}</CardDescription>
				) : null}
				<Badge variant="secondary">{language}</Badge>
			</CardHeader>
			<CardContent>
				<ItemGroup>
					<Item variant="muted">
						<ItemMedia variant="icon">
							<GraduationCapIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Modules</ItemTitle>
						</ItemContent>
						<ItemActions>
							<Badge variant="outline">{course.moduleCount}</Badge>
						</ItemActions>
					</Item>
					<Item variant="muted">
						<ItemMedia variant="icon">
							<VideoIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Videos</ItemTitle>
						</ItemContent>
						<ItemActions>
							<Badge variant="outline">{course.videoCount}</Badge>
						</ItemActions>
					</Item>
				</ItemGroup>
			</CardContent>
		</Card>
	);
}
