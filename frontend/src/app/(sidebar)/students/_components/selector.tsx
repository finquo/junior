"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpenIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/hooks/api";
import { FetchLesson } from "@/hooks/lesson";

export function LessonSelector({
	label = "Lesson",
	enrolledLessonIds = [],
	value,
	onValueChange,
}: {
	label?: string;
	enrolledLessonIds?: string[];
	value?: string | null;
	onValueChange?: (val: string) => void;
}) {
	const { data = [] } = useQuery(api.core.lesson.list.queryOptions());

	const availableLessons = data.filter(
		(l) => !enrolledLessonIds.includes(l.id),
	);

	return (
		<Field>
			<Select
				value={value}
				onValueChange={(val) => {
					if (onValueChange && val) onValueChange(val);
				}}
			>
				<SelectTrigger>
					<SelectValue
						placeholder={`Select a ${label.toLowerCase()}`}
						children={(itemId: string) => (
							<FetchLesson
								id={itemId}
								children={(lesson) => <span>{lesson.name}</span>}
							/>
						)}
					/>
				</SelectTrigger>
				<SelectContent alignItemWithTrigger={false}>
					<SelectGroup>
						<SelectLabel>Available Lessons</SelectLabel>
						{availableLessons.length === 0 ? (
							<SelectItem value="none" disabled>
								All lessons already enrolled
							</SelectItem>
						) : (
							availableLessons.map((l) => (
								<SelectItem key={l.id} value={l.id}>
									<FetchLesson
										id={l.id}
										children={(lesson) => (
											<span className="flex items-center gap-2">
												<BookOpenIcon className="size-4 text-muted-foreground" />
												<span>{lesson.name}</span>
												{lesson.language && (
													<Badge variant="secondary" className="text-xs">
														{lesson.language}
													</Badge>
												)}
											</span>
										)}
									/>
								</SelectItem>
							))
						)}
					</SelectGroup>
				</SelectContent>
			</Select>
		</Field>
	);
}

export default LessonSelector;
