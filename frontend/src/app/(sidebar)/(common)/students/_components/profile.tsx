"use client";

import {
	BookOpenIcon,
	ExternalLinkIcon,
	PenIcon,
	PlusIcon,
	VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { RenderWhenRole } from "@/hooks/role";
import { FetchUser } from "@/hooks/user";
import type { API_Returns } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/utils";
import { EditStudentDrawer } from "./edit-drawer";

type StudentData = NonNullable<API_Returns["core"]["student"]["get"]>;

export function StudentProfile({ data }: { data: StudentData }) {
	const address = data.address;
	const notes = data.notes ?? [];

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
							<ColorBadge variant="info">Student</ColorBadge>
							<ColorBadge variant={user.emailVerified ? "success" : "warning"}>
								{user.emailVerified ? "Verified" : "Unverified"}
							</ColorBadge>
							{user.banned && (
								<ColorBadge variant="destructive">Banned</ColorBadge>
							)}
						</>
					)}
				</FetchUser>

				<CardAction>
					<ButtonGroup>
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={
								<Link
									href={{
										pathname: "/slots/new",
										query: {
											studentId: data.id,
										},
									}}
								/>
							}
						>
							<VideoIcon />
							Schedule Session
						</Button>
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={<Link href={`/students/${data.id}/lessons`} />}
						>
							<BookOpenIcon />
							Manage Lessons
						</Button>
					</ButtonGroup>
					<RenderWhenRole role={["admin", "scheduler"]}>
						<EditStudentDrawer student={data}>
							<Button variant="outline" size="sm">
								<PenIcon />
								Edit
							</Button>
						</EditStudentDrawer>
					</RenderWhenRole>
				</CardAction>
			</CardHeader>

			<CardContent>
				<Table>
					<TableBody>
						\n{" "}
						<TableRow>
							<TableCell>User ID</TableCell>
							<TableCell>{data.id}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Program</TableCell>
							<TableCell>{data.program ?? "None"}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Schooling</TableCell>
							<TableCell>{data.schooling ?? "None"}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Lessons Enrolled</TableCell>
							<TableCell>
								<Button
									variant="link"
									size="sm"
									nativeButton={false}
									render={<Link href={`/students/${data.id}/lessons`} />}
								>
									{data.lessons?.length ?? 0} lessons
									<ExternalLinkIcon />
								</Button>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Languages</TableCell>
							<TableCell>
								{Array.isArray(data.languages) && data.languages.length
									? data.languages.map((lang) => (
											<Badge key={String(lang)} variant="secondary">
												{String(lang)}
											</Badge>
										))
									: "None"}
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Fee Status</TableCell>
							<TableCell>
								<ColorBadge variant={data.paid ? "success" : "warning"}>
									{data.paid ? "Paid" : "Pending"}
								</ColorBadge>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Total Amount</TableCell>
							<TableCell>₹{data.amount ?? 0}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Remaining Balance</TableCell>
							<TableCell>₹{data.remaining ?? 0}</TableCell>
						</TableRow>
						{data.meetingLink && (
							<TableRow>
								<TableCell>Meeting Link</TableCell>
								<TableCell>
									<a
										href={data.meetingLink}
										target="_blank"
										rel="noopener noreferrer"
									>
										{data.meetingLink}
									</a>
								</TableCell>
							</TableRow>
						)}
						{data.mentorId && (
							<TableRow>
								<TableCell>Mentor ID</TableCell>
								<TableCell>{data.mentorId}</TableCell>
							</TableRow>
						)}
						{data.supervisorId && (
							<TableRow>
								<TableCell>Supervisor ID</TableCell>
								<TableCell>{data.supervisorId}</TableCell>
							</TableRow>
						)}
						<TableRow>
							<TableCell>Joined</TableCell>
							<TableCell>{formatDate(data.createdAt)}</TableCell>
						</TableRow>
					</TableBody>
				</Table>

				{address && (
					<>
						<Separator />
						<Card>
							<CardHeader>
								<CardTitle>Address</CardTitle>
							</CardHeader>
							<CardContent>
								<Table>
									<TableBody>
										<TableRow>
											<TableCell>Street</TableCell>
											<TableCell>
												{address.line1}
												{address.line2 ? `, ${address.line2}` : ""}
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>City / State</TableCell>
											<TableCell>
												{address.city}, {address.state}
											</TableCell>
										</TableRow>
										<TableRow>
											<TableCell>Postal Code / Country</TableCell>
											<TableCell>
												{address.postalCode}, {address.country}
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</>
				)}

				<Separator />
				<Card>
					<CardHeader>
						<CardTitle>Notes</CardTitle>
						<CardAction>
							<Button variant="outline" size="sm">
								<PlusIcon />
								Add Note
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						{notes.length === 0 ? (
							<Alert>
								<AlertTitle>No notes</AlertTitle>
								<AlertDescription>
									No notes recorded for this student.
								</AlertDescription>
							</Alert>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Note</TableHead>
										<TableHead>Author</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{notes.map((note, idx) => (
										<TableRow key={idx as number}>
											<TableCell>{note.text}</TableCell>
											<TableCell>{note.writterBy}</TableCell>
											<TableCell>{formatDate(note.createdAt)}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</CardContent>
		</Card>
	);
}
