"use client";

import { useQuery } from "@tanstack/react-query";
import type { Address, Note } from "backend/config";
import { BookOpenIcon, ExternalLinkIcon, PenIcon } from "lucide-react";
import Link from "next/link";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/hooks/api";
import { RenderWhenRole } from "@/hooks/role";
import type { API_Returns } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/utils";

export type StudentUserData = NonNullable<API_Returns["core"]["getStudent"]>;

export function StudentProfileView({
	studentUser,
}: {
	studentUser: StudentUserData;
}) {
	const student = studentUser.studentData;
	const address = student?.address as Address | null;
	const notes = (student?.notes ?? []) as Note[];

	return (
		<Card>
			<CardHeader>
				<Avatar size="lg">
					{studentUser.image && (
						<AvatarImage src={studentUser.image} alt={studentUser.name} />
					)}
					<AvatarFallback>{getInitials(studentUser.name)}</AvatarFallback>
				</Avatar>
				<CardTitle>{studentUser.name}</CardTitle>
				<CardDescription>{studentUser.email}</CardDescription>
				<ColorBadge variant="info">Student</ColorBadge>
				<ColorBadge variant={studentUser.emailVerified ? "success" : "warning"}>
					{studentUser.emailVerified ? "Verified" : "Unverified"}
				</ColorBadge>
				{studentUser.banned && (
					<ColorBadge variant="destructive">Banned</ColorBadge>
				)}

				<CardAction>
					<Button
						variant="outline"
						size="sm"
						nativeButton={false}
						render={<Link href={`/students/${studentUser.id}/lessons`} />}
					>
						<BookOpenIcon />
						Manage Lessons
					</Button>

					<RenderWhenRole role="scheduler">
						<Drawer>
							<DrawerTrigger
								render={
									<Button variant="outline" size="sm">
										<PenIcon />
										Edit Student
									</Button>
								}
							/>
							<DrawerContent>
								<DrawerHeader>
									<DrawerTitle>Edit Student</DrawerTitle>
									<DrawerDescription>
										Update student record for {studentUser.name}
									</DrawerDescription>
								</DrawerHeader>
								<DrawerFooter>
									<DrawerClose render={<Button variant="outline" />}>
										Close
									</DrawerClose>
								</DrawerFooter>
							</DrawerContent>
						</Drawer>
					</RenderWhenRole>
				</CardAction>
			</CardHeader>

			<CardContent>
				<Table>
					<TableBody>
						<TableRow>
							<TableCell>User ID</TableCell>
							<TableCell>{studentUser.id}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Program</TableCell>
							<TableCell>{student?.program ?? "None"}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Schooling</TableCell>
							<TableCell>{student?.schooling ?? "None"}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Lessons Enrolled</TableCell>
							<TableCell>
								<Button
									variant="link"
									size="sm"
									nativeButton={false}
									render={<Link href={`/students/${studentUser.id}/lessons`} />}
								>
									{student?.lessons?.length ?? 0} lessons
									<ExternalLinkIcon />
								</Button>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Languages</TableCell>
							<TableCell>
								{Array.isArray(student?.languages) && student.languages.length
									? student.languages.map((lang) => (
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
								<ColorBadge variant={student?.paid ? "success" : "warning"}>
									{student?.paid ? "Paid" : "Pending"}
								</ColorBadge>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Total Amount</TableCell>
							<TableCell>₹{student?.amount ?? 0}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Remaining Balance</TableCell>
							<TableCell>₹{student?.remaining ?? 0}</TableCell>
						</TableRow>
						{student?.meetingLink && (
							<TableRow>
								<TableCell>Meeting Link</TableCell>
								<TableCell>
									<a
										href={student.meetingLink}
										target="_blank"
										rel="noopener noreferrer"
									>
										{student.meetingLink}
									</a>
								</TableCell>
							</TableRow>
						)}
						{student?.mentorId && (
							<TableRow>
								<TableCell>Mentor ID</TableCell>
								<TableCell>{student.mentorId}</TableCell>
							</TableRow>
						)}
						{student?.supervisorId && (
							<TableRow>
								<TableCell>Supervisor ID</TableCell>
								<TableCell>{student.supervisorId}</TableCell>
							</TableRow>
						)}
						<TableRow>
							<TableCell>Joined</TableCell>
							<TableCell>{formatDate(studentUser.createdAt)}</TableCell>
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

				{notes.length > 0 && (
					<>
						<Separator />
						<Card>
							<CardHeader>
								<CardTitle>Notes</CardTitle>
							</CardHeader>
							<CardContent>
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
											<TableRow key={idx}>
												<TableCell>{note.text}</TableCell>
												<TableCell>{note.writterBy}</TableCell>
												<TableCell>{formatDate(note.createdAt)}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					</>
				)}
			</CardContent>
		</Card>
	);
}

export function StudentProfile({ id }: { id: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.getStudent.queryOptions({
			input: { id },
		}),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Student Not Found</AlertTitle>
				<AlertDescription>
					The requested student profile could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return <StudentProfileView studentUser={data} />;
}

export default StudentProfile;
