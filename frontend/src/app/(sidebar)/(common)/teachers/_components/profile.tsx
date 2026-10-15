"use client";

import { type Availability, dayKeys, type LanguageCodes } from "backend/config";
import { langFlag, langName } from "language-emoji";
import {
	BriefcaseIcon,
	CalendarDaysIcon,
	CalendarIcon,
	ExternalLinkIcon,
	LanguagesIcon,
	PenIcon,
	PlaneIcon,
	UserRoundIcon,
	VideoIcon,
} from "lucide-react";
import Link from "next/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RenderWhenRole } from "@/hooks/role";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import { formatDate, getInitials, snakeToTitleCase } from "@/lib/utils";
import { EditTeacherDrawer } from "./edit-drawer";

type TeacherData = NonNullable<API_Returns["core"]["teacher"]["get"]>;

const leaveVariant: Record<string, "info" | "warning" | "destructive"> = {
	full: "destructive",
	partial: "warning",
	multiple: "info",
};

export function TeacherProfile({ data }: { data: TeacherData }) {
	const experiences = data.experiences ?? [];
	const languages = data.languages ?? [];
	const leaves = data.leaves ?? [];
	const availability: Availability | null = data.availability ?? null;
	const availableDays = dayKeys.filter(
		(day) =>
			availability?.[day]?.enabled &&
			(availability?.[day]?.ranges?.length ?? 0) > 0,
	);

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
								Teacher
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
									query: { teacherId: data.id },
								}}
							>
								<VideoIcon />
								Schedule Session
							</Link>
						</Button>
						<Button variant="outline" size="sm" asChild>
							<Link href="/slots">
								<CalendarIcon />
								View Sessions
							</Link>
						</Button>
						<RenderWhenRole role={["admin", "scheduler"]}>
							<EditTeacherDrawer teacher={data}>
								<Button variant="outline" size="sm">
									<PenIcon />
									Edit
								</Button>
							</EditTeacherDrawer>
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
						<TabsTrigger value="availability">
							<CalendarDaysIcon />
							Availability
						</TabsTrigger>
						<TabsTrigger value="leaves">
							<PlaneIcon />
							Leaves
						</TabsTrigger>
						<TabsTrigger value="experience">
							<BriefcaseIcon />
							Experience
						</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Details</CardTitle>
								<CardDescription>
									Supervisor, teaching languages and account timeline.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ItemGroup>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<UserRoundIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Supervisor</ItemTitle>
											{data.supervisorId ? (
												<FetchUser
													id={data.supervisorId}
													isPending={
														<ItemDescription>Loading…</ItemDescription>
													}
												>
													{(supervisor) => (
														<ItemDescription>{supervisor.name}</ItemDescription>
													)}
												</FetchUser>
											) : (
												<ItemDescription>Not assigned</ItemDescription>
											)}
										</ItemContent>
										<ItemActions>
											{data.supervisorId && (
												<Button variant="ghost" size="sm" asChild>
													<Link
														href={`/schedulers/${data.supervisorId}` as "/"}
													>
														View
														<ExternalLinkIcon />
													</Link>
												</Button>
											)}
										</ItemActions>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<LanguagesIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Teaching Languages</ItemTitle>
										</ItemContent>
										<ItemActions>
											{languages.length > 0 ? (
												languages.map((code: LanguageCodes) => (
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
											<CalendarIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Joined</ItemTitle>
											<ItemDescription>
												{formatDate(data.createdAt)}
											</ItemDescription>
										</ItemContent>
									</Item>
									<Item variant="muted">
										<ItemMedia variant="icon">
											<CalendarIcon />
										</ItemMedia>
										<ItemContent>
											<ItemTitle>Last Updated</ItemTitle>
											<ItemDescription>
												{formatDate(data.updatedAt)}
											</ItemDescription>
										</ItemContent>
									</Item>
								</ItemGroup>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="availability" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Weekly Availability</CardTitle>
								<CardDescription>
									{availableDays.length > 0
										? `Available on ${availableDays.length} day${availableDays.length === 1 ? "" : "s"} per week.`
										: "This teacher has not published availability yet."}
								</CardDescription>
							</CardHeader>
							<CardContent>
								{!availability ? (
									<Empty>
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<CalendarDaysIcon />
											</EmptyMedia>
											<EmptyTitle>No availability set</EmptyTitle>
											<EmptyDescription>
												Availability has not been configured for this teacher.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								) : (
									<ItemGroup>
										{dayKeys.map((day) => {
											const config = availability[day];
											const ranges = config?.ranges ?? [];
											return (
												<Item key={day} variant="outline">
													<ItemMedia variant="icon">
														<CalendarDaysIcon />
													</ItemMedia>
													<ItemContent>
														<ItemTitle className="capitalize">{day}</ItemTitle>
													</ItemContent>
													<ItemActions>
														{config?.enabled && ranges.length > 0 ? (
															ranges.map((range) => (
																<Badge
																	key={`${range.start}-${range.end}`}
																	variant="success"
																>
																	{range.start} – {range.end}
																</Badge>
															))
														) : (
															<Badge variant="outline">Off</Badge>
														)}
													</ItemActions>
												</Item>
											);
										})}
									</ItemGroup>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="leaves" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Leaves</CardTitle>
								<CardDescription>
									Recorded full, partial and multi-day leaves.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{leaves.length === 0 ? (
									<Empty>
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<PlaneIcon />
											</EmptyMedia>
											<EmptyTitle>No leaves recorded</EmptyTitle>
											<EmptyDescription>
												This teacher has no leave on record.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								) : (
									<ItemGroup>
										{leaves.map((leave, idx) => (
											<Item key={idx as number} variant="outline">
												<ItemMedia variant="icon">
													<PlaneIcon />
												</ItemMedia>
												<ItemContent>
													<ItemTitle>
														{formatDate(leave.start)} → {formatDate(leave.end)}
													</ItemTitle>
													<ItemDescription>
														{leave.type === "partial"
															? "Partial day leave"
															: "Full day leave"}
													</ItemDescription>
												</ItemContent>
												<ItemActions>
													<ColorBadge
														variant={leaveVariant[leave.type] ?? "secondary"}
													>
														{snakeToTitleCase(leave.type)}
													</ColorBadge>
												</ItemActions>
											</Item>
										))}
									</ItemGroup>
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="experience" className="flex flex-col gap-4">
						<Card size="sm">
							<CardHeader>
								<CardTitle>Experience</CardTitle>
								<CardDescription>
									Professional teaching background.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{experiences.length === 0 ? (
									<Empty>
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<BriefcaseIcon />
											</EmptyMedia>
											<EmptyTitle>No experience listed</EmptyTitle>
											<EmptyDescription>
												This teacher has not added any work history.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								) : (
									<Accordion type="multiple">
										{experiences.map((exp, idx) => (
											<AccordionItem
												key={idx as number}
												value={`experience-${idx}`}
											>
												<AccordionTrigger>{exp.title}</AccordionTrigger>
												<AccordionContent>
													<Table>
														<TableBody>
															<TableRow>
																<TableCell>Organization</TableCell>
																<TableCell>{exp.organization}</TableCell>
															</TableRow>
															<TableRow>
																<TableCell>Period</TableCell>
																<TableCell>
																	{formatDate(exp.startedAt)} –{" "}
																	{exp.endedAt
																		? formatDate(exp.endedAt)
																		: "Present"}
																</TableCell>
															</TableRow>
															{exp.description && (
																<TableRow>
																	<TableCell>Description</TableCell>
																	<TableCell>{exp.description}</TableCell>
																</TableRow>
															)}
														</TableBody>
													</Table>
												</AccordionContent>
											</AccordionItem>
										))}
									</Accordion>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
