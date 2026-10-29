"use client";

import {
	BookOpenIcon,
	CircleDollarSignIcon,
	ExternalLinkIcon,
	GraduationCapIcon,
	HashIcon,
	LayersIcon,
	ListChecksIcon,
	PenIcon,
	UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import {
	type CountryCodes,
	getCountryCurrencySymbol,
	getCountryName,
} from "utils";
import { CopyButton } from "@/components/copy";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { API_Returns } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import { ProgramCurriculum } from "./curriculum";

type ProgramData = NonNullable<API_Returns["core"]["program"]["get"]>;
type ProgramStudent = API_Returns["core"]["program"]["students"][number];
type ProgramLesson = API_Returns["core"]["program"]["lessons"][number];

function formatPrice(code: CountryCodes, amount: number) {
	return `${getCountryCurrencySymbol(code)}${amount.toLocaleString()}`;
}

function StudentItem({ student }: { student: ProgramStudent }) {
	const user = student.user;
	const name = user?.name ?? "Student";

	return (
		<Item variant="outline" asChild>
			<Link href={`/students/${student.id}` as "/"}>
				<ItemMedia>
					<Avatar size="sm">
						{user?.image && <AvatarImage src={user.image} alt={name} />}
						<AvatarFallback>{getInitials(name)}</AvatarFallback>
					</Avatar>
				</ItemMedia>
				<ItemContent>
					<ItemTitle>{name}</ItemTitle>
					{user?.email && <ItemDescription>{user.email}</ItemDescription>}
				</ItemContent>
				<ItemActions>
					<ExternalLinkIcon />
				</ItemActions>
			</Link>
		</Item>
	);
}

function PersonSkeleton() {
	return (
		<Item variant="outline">
			<ItemMedia>
				<Skeleton className="size-8 rounded-full" />
			</ItemMedia>
			<ItemContent>
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-3 w-56" />
			</ItemContent>
		</Item>
	);
}

function LessonSkeleton() {
	return (
		<Item variant="outline">
			<ItemMedia variant="icon">
				<Skeleton />
			</ItemMedia>
			<ItemContent>
				<Skeleton className="h-4 w-40" />
				<Skeleton className="h-3 w-56" />
			</ItemContent>
		</Item>
	);
}

export function ProgramProfile({
	data,
	students,
	lessons,
	studentsPending,
	lessonsPending,
}: {
	data: ProgramData;
	students: ProgramStudent[];
	lessons: ProgramLesson[];
	studentsPending: boolean;
	lessonsPending: boolean;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{data.name}</CardTitle>
				<CardDescription>{data.description}</CardDescription>
				<ColorBadge variant="info">Program</ColorBadge>
				<Badge variant="outline">{data.lessonCount} Lessons</Badge>
				{!studentsPending && (
					<Badge variant="outline">{students.length} Students</Badge>
				)}
				{!lessonsPending && (
					<Badge variant="outline">{lessons.length} Published</Badge>
				)}
				<CardAction>
					<ButtonGroup>
						<CopyButton
							text={() => data.id}
							label="Program ID"
							variant="outline"
							size="sm"
						/>
						<Button asChild variant="outline" size="sm">
							<Link href={`/programs/${data.id}/edit` as "/"}>
								<PenIcon />
								Edit
							</Link>
						</Button>
						<Button asChild size="sm">
							<Link
								href={{
									pathname: "/lessons/new",
									query: { programId: data.id },
								}}
							>
								<BookOpenIcon />
								Create Lesson
							</Link>
						</Button>
					</ButtonGroup>
				</CardAction>
			</CardHeader>

			<CardContent>
				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">
							<LayersIcon />
							Overview
						</TabsTrigger>
						<TabsTrigger value="students">
							<GraduationCapIcon />
							Students
						</TabsTrigger>
						<TabsTrigger value="lessons">
							<BookOpenIcon />
							Lessons
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Program Details</CardTitle>
								<CardDescription>
									Metadata and curriculum size for this program.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ItemGroup>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<HashIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Program ID</ItemTitle>
											<ItemDescription>{data.id}</ItemDescription>
										</ItemContent>
										<ItemActions>
											<CopyButton
												text={() => data.id}
												label="Program ID"
												variant="ghost"
												size="icon-sm"
											/>
										</ItemActions>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<ListChecksIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Lessons Included</ItemTitle>
											<ItemDescription>
												{data.lessonCount} lessons in the curriculum
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<GraduationCapIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Enrolled Students</ItemTitle>
											<ItemDescription>
												{studentsPending
													? "Loading students..."
													: `${students.length} students enrolled`}
											</ItemDescription>
										</ItemContent>
									</Item>
								</ItemGroup>
							</CardContent>
						</Card>

						<Card size="sm">
							<CardHeader>
								<CardTitle>Pricing</CardTitle>
								<CardDescription>
									Regional pricing for this program.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ItemGroup>
									{Object.entries(data.price).map(([code, amount]) => (
										<Item key={code} variant="muted">
											<ItemMedia variant="icon">
												<CircleDollarSignIcon />
											</ItemMedia>
											<ItemContent>
												<ItemTitle>{getCountryName(code)}</ItemTitle>
												<ItemDescription>
													{formatPrice(code as CountryCodes, amount)}
												</ItemDescription>
											</ItemContent>
											<ItemActions>
												<Badge variant="outline">{code}</Badge>
											</ItemActions>
										</Item>
									))}
								</ItemGroup>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="students" className="flex flex-col gap-4">
						{studentsPending ? (
							<ItemGroup>
								{[0, 1, 2].map((index) => (
									<PersonSkeleton key={index as number} />
								))}
							</ItemGroup>
						) : students.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<UserRoundIcon />
									</EmptyMedia>
									<EmptyTitle>No Students</EmptyTitle>
									<EmptyDescription>
										No students are enrolled in this program yet.
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							<ItemGroup>
								{students.map((student) => (
									<StudentItem key={student.id} student={student} />
								))}
							</ItemGroup>
						)}
					</TabsContent>

					<TabsContent value="lessons" className="flex flex-col gap-4">
						{lessonsPending ? (
							<ItemGroup>
								{[0, 1, 2].map((index) => (
									<LessonSkeleton key={index as number} />
								))}
							</ItemGroup>
						) : lessons.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<BookOpenIcon />
									</EmptyMedia>
									<EmptyTitle>No Lessons</EmptyTitle>
									<EmptyDescription>
										This program does not have any lessons yet.
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							<ProgramCurriculum programId={data.id} lessons={lessons} />
						)}
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
