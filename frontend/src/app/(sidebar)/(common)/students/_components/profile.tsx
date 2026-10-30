"use client";

import { langFlag, langName } from "language-emoji";
import {
	BookMarkedIcon,
	BookOpenIcon,
	CakeIcon,
	CoinsIcon,
	ExternalLinkIcon,
	GlobeIcon,
	GraduationCapIcon,
	LanguagesIcon,
	MapPinIcon,
	NotebookPenIcon,
	PenIcon,
	SchoolIcon,
	UserRoundIcon,
	VideoIcon,
	WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { Countries } from "utils";
import { ProgramLink } from "@/components/program";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImpersonateButton } from "@/hooks/admin";
import { RenderWhenRole } from "@/hooks/role";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import { formatDate, getInitials, snakeToTitleCase } from "@/lib/utils";
import { EditStudentDrawer } from "./edit-drawer";

type StudentData = NonNullable<API_Returns["core"]["student"]["get"]>;
type CurriculumData = API_Returns["core"]["student"]["getCurriculum"];

function PersonItem({
	label,
	name,
	email,
	image,
	href,
}: {
	label: string;
	name: string;
	email?: string | null;
	image?: string | null;
	href: string;
}) {
	return (
		<Item variant="outline" asChild>
			<Link href={href as "/"}>
				<ItemMedia>
					<Avatar size="sm">
						{image && <AvatarImage src={image} alt={name} />}
						<AvatarFallback>{getInitials(name)}</AvatarFallback>
					</Avatar>
				</ItemMedia>
				<ItemContent>
					<ItemTitle>{name}</ItemTitle>
					{email && <ItemDescription>{email}</ItemDescription>}
				</ItemContent>
				<ItemActions>
					<ColorBadge variant="secondary">{label}</ColorBadge>
				</ItemActions>
			</Link>
		</Item>
	);
}

function EmptyPersonItem({ label }: { label: string }) {
	return (
		<Item variant="outline">
			<ItemMedia variant="icon">
				<UserRoundIcon />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>{label}</ItemTitle>
				<ItemDescription>Not assigned</ItemDescription>
			</ItemContent>
		</Item>
	);
}

function PersonItemSkeleton({ label }: { label: string }) {
	return (
		<Item variant="outline">
			<ItemMedia>
				<Skeleton className="size-8 rounded-full" />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>{label}</ItemTitle>
				<Skeleton className="h-3 w-32" />
			</ItemContent>
		</Item>
	);
}

export function StudentProfile({
	data,
	curriculum,
}: {
	data: StudentData;
	curriculum?: CurriculumData;
}) {
	const notes = data.notes ?? [];
	const languages = Array.isArray(data.languages) ? data.languages : [];

	const total = data.amount ?? 0;
	const remaining = data.remaining ?? 0;
	const paidAmount = Math.max(total - remaining, 0);
	const paymentProgress =
		total > 0 ? Math.round((paidAmount / total) * 100) : data.paid ? 100 : 0;

	return (
		<Card>
			<CardHeader>
				<FetchUser id={data.id}>
					{(user) => (
						<>
							<Avatar size="lg">
								{user.image && <AvatarImage src={user.image} alt={user.name} />}
								<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
							</Avatar>
							<CardTitle>{user.name}</CardTitle>
							<CardDescription>{user.email}</CardDescription>
							<ColorBadge variant="info" className="col-span-full">
								Student
							</ColorBadge>
							{user.banned && (
								<ColorBadge variant="destructive" className="col-span-full">
									Banned
								</ColorBadge>
							)}
						</>
					)}
				</FetchUser>

				<CardAction>
					<ButtonGroup>
						<Button variant="outline" size="sm" asChild>
							<Link
								href={{
									pathname: "/slots/new",
									query: { studentId: data.id },
								}}
							>
								<VideoIcon />
								Schedule Session
							</Link>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link href={`/students/${data.id}/lessons` as "/"}>
								<BookOpenIcon />
								Manage Lessons
							</Link>
						</Button>
						<RenderWhenRole role="admin">
							<Button variant="outline" size="sm" asChild>
								<Link href={`/students/${data.id}/payments` as "/"}>
									<WalletIcon />
									Payments
								</Link>
							</Button>
						</RenderWhenRole>
						<RenderWhenRole role={["admin", "scheduler"]}>
							<EditStudentDrawer student={data}>
								<Button variant="outline" size="sm">
									<PenIcon />
									Edit
								</Button>
							</EditStudentDrawer>
						</RenderWhenRole>
						<RenderWhenRole role="admin">
							<ImpersonateButton userId={data.id} asChild>
								<Button variant="outline" size="sm">
									<ExternalLinkIcon />
									Impersonate
								</Button>
							</ImpersonateButton>
						</RenderWhenRole>
					</ButtonGroup>
				</CardAction>
			</CardHeader>

			<CardContent>
				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">
							<UserRoundIcon />
							Overview
						</TabsTrigger>
						<TabsTrigger value="lessons">
							<BookOpenIcon />
							Lessons
						</TabsTrigger>
						<TabsTrigger value="notes">
							<NotebookPenIcon />
							Notes
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Mentorship</CardTitle>
								<CardDescription>
									Assigned mentor and scheduling supervisor.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ItemGroup>
									{data.mentorId ? (
										<FetchUser
											id={data.mentorId}
											isPending={<PersonItemSkeleton label="Mentor" />}
											notFound={<EmptyPersonItem label="Mentor" />}
										>
											{(mentor) => (
												<PersonItem
													label="Mentor"
													name={mentor.name}
													email={mentor.email}
													image={mentor.image}
													href={`/teachers/${mentor.id}`}
												/>
											)}
										</FetchUser>
									) : (
										<EmptyPersonItem label="Mentor" />
									)}
									{data.supervisorId ? (
										<FetchUser
											id={data.supervisorId}
											isPending={<PersonItemSkeleton label="Supervisor" />}
											notFound={<EmptyPersonItem label="Supervisor" />}
										>
											{(supervisor) => (
												<PersonItem
													label="Supervisor"
													name={supervisor.name}
													email={supervisor.email}
													image={supervisor.image}
													href={`/schedulers/${supervisor.id}`}
												/>
											)}
										</FetchUser>
									) : (
										<EmptyPersonItem label="Supervisor" />
									)}
								</ItemGroup>
							</CardContent>
						</Card>

						<Card size="sm">
							<CardHeader>
								<CardTitle>Enrollment</CardTitle>
								<CardDescription>
									Academic details and program placement.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="grid gap-4 sm:grid-cols-2">
									<Item variant="muted">
										<ItemMedia variant="icon">
											<GraduationCapIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Program</ItemTitle>
											<ProgramLink
												id={data.program}
												name={data.programInfo?.name}
												placeholder={
													<ItemDescription>No program assigned</ItemDescription>
												}
											/>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<SchoolIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Schooling</ItemTitle>
											<ItemDescription className="capitalize">
												{data.schooling ?? "Not specified"}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<LanguagesIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Languages</ItemTitle>
										</ItemContent>
										<ItemActions>
											{languages.length > 0 ? (
												languages.map((code) => (
													<Badge key={code} variant="secondary">
														{langFlag(code)} {langName(code)}
													</Badge>
												))
											) : (
												<Badge variant="outline">Not specified</Badge>
											)}
										</ItemActions>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<CakeIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Age</ItemTitle>
											<ItemDescription>
												{data.age ?? "Not specified"}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<BookMarkedIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Grade</ItemTitle>
											<ItemDescription>
												{data.grade ?? "Not specified"}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<GlobeIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Country</ItemTitle>
											<ItemDescription>
												{data.country
													? Countries[data.country]
													: "Not specified"}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<CoinsIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Currency</ItemTitle>
											<ItemDescription>{data.currency}</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<WalletIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Enrolled On</ItemTitle>
											<ItemDescription>
												{formatDate(data.createdAt)}
											</ItemDescription>
										</ItemContent>
									</Item>
								</div>
							</CardContent>
						</Card>

						<Card size="sm">
							<CardHeader>
								<CardTitle>Fee Payment</CardTitle>
								<CardDescription>
									Track the student's program fee and balance.
								</CardDescription>
								<CardAction>
									<ColorBadge variant={data.paid ? "success" : "warning"}>
										{data.paid ? "Fully Paid" : "Payment Pending"}
									</ColorBadge>
								</CardAction>
							</CardHeader>
							<CardContent>
								<Progress value={paymentProgress} />
								<Table>
									<TableBody>
										<TableRow>
											<TableCell>Total Amount</TableCell>
											<TableCell>₹{total}</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>Paid</TableCell>
											<TableCell>₹{paidAmount}</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>Remaining</TableCell>
											<TableCell>₹{remaining}</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</CardContent>
						</Card>

						{data.address && (
							<Card size="sm">
								<CardHeader>
									<CardTitle>Address</CardTitle>
									<CardDescription>Contact address on record.</CardDescription>
								</CardHeader>
								<CardContent>
									<ItemGroup>
										<Item variant="muted">
											<ItemMedia variant="icon">
												<MapPinIcon />
											</ItemMedia>
											<ItemContent>
												<ItemTitle>
													{data.address.line1}
													{data.address.line2 ? `, ${data.address.line2}` : ""}
												</ItemTitle>
												<ItemDescription>
													{data.address.city}, {data.address.state},{" "}
													{data.address.postalCode}, {data.address.country}
												</ItemDescription>
											</ItemContent>
										</Item>
									</ItemGroup>
								</CardContent>
							</Card>
						)}
					</TabsContent>

					<TabsContent value="lessons" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Curriculum</CardTitle>
								<CardDescription>
									Lessons in this student's program, in order.
								</CardDescription>
								<CardAction>
									<Button variant="outline" size="sm" asChild>
										<Link href={`/students/${data.id}/lessons` as "/"}>
											<PenIcon />
											Manage
										</Link>
									</Button>
								</CardAction>
							</CardHeader>
							<CardContent>
								{!curriculum?.program ? (
									<Empty>
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<GraduationCapIcon />
											</EmptyMedia>
											<EmptyTitle>No program assigned</EmptyTitle>
											<EmptyDescription>
												Assign a program to build this student's curriculum.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								) : curriculum.lessons.length === 0 ? (
									<Empty>
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<BookOpenIcon />
											</EmptyMedia>
											<EmptyTitle>No lessons in this program</EmptyTitle>
											<EmptyDescription>
												Add lessons to the program to build the curriculum.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								) : (
									<ItemGroup>
										{curriculum.lessons.map((lesson) => {
											const attended = curriculum.attendedLessons.includes(
												lesson.id,
											);
											return (
												<Item variant="outline" key={lesson.id}>
													<ItemMedia variant="icon">
														<BookOpenIcon />
													</ItemMedia>
													<ItemContent>
														<ItemTitle>{lesson.name}</ItemTitle>
														{lesson.description && (
															<ItemDescription>
																{lesson.description}
															</ItemDescription>
														)}
													</ItemContent>
													<ItemActions>
														<Badge variant="secondary">
															{langFlag(lesson.language)}{" "}
															{langName(lesson.language)}
														</Badge>
														<ColorBadge
															variant={attended ? "success" : "warning"}
														>
															{attended ? "Attended" : "Pending"}
														</ColorBadge>
														<Button variant="ghost" size="sm" asChild>
															<Link href={`/lessons/${lesson.id}` as "/"}>
																Open
																<ExternalLinkIcon />
															</Link>
														</Button>
													</ItemActions>
												</Item>
											);
										})}
									</ItemGroup>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="notes" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Notes</CardTitle>
								<CardDescription>
									Internal observations recorded for this student.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{notes.length === 0 ? (
									<Empty>
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<NotebookPenIcon />
											</EmptyMedia>
											<EmptyTitle>No notes yet</EmptyTitle>
											<EmptyDescription>
												Notes written about this student will appear here.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								) : (
									<Table>
										<TableBody>
											{notes.map((note, idx) => (
												<TableRow key={idx as number}>
													<TableCell>{note.text}</TableCell>
													<TableCell>
														<ColorBadge>
															{snakeToTitleCase(note.writterBy)}
														</ColorBadge>
													</TableCell>
													<TableCell>{formatDate(note.createdAt)}</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
