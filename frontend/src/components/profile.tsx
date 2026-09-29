import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Avatar,
	AvatarBadge,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar";
import { ColorBadge } from "@/components/ui/badge";
import {
	Card,
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
import { SwitchNode } from "@/components/utils";
import { formatDate, getInitials, snakeToTitleCase } from "@/lib/utils";
import type {
	Address,
	Experience,
	Note,
	SelectSchedulerType,
	SelectStudentType,
	SelectTeacherType,
	SelectUserType
} from "backend/config";

export function StudentProfile({
	student,
}: {
	student?: SelectStudentType | null;
}) {
	if (!student) return null;

	const address = student.address as Address | null;
	const notes = (student.notes ?? []) as Note[];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Student Details</CardTitle>
				<CardDescription>Academic and enrollment information</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableBody>
						<TableRow>
							<TableCell>Program</TableCell>
							<TableCell>{student.program ?? "None"}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Schooling</TableCell>
							<TableCell>{student.schooling ?? "None"}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Lessons Enrolled</TableCell>
							<TableCell>{student.lessons?.length ?? 0}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Languages</TableCell>
							<TableCell>
								{student.languages?.length
									? student.languages.map((lang) => (
											<ColorBadge key={lang}>{lang}</ColorBadge>
										))
									: "None"}
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Fee Status</TableCell>
							<TableCell>
								<ColorBadge variant={student.paid ? "success" : "warning"}>
									{student.paid ? "Paid" : "Pending"}
								</ColorBadge>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Total Amount</TableCell>
							<TableCell>{student.amount}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Remaining Balance</TableCell>
							<TableCell>{student.remaining}</TableCell>
						</TableRow>
						{student.meetingLink && (
							<TableRow>
								<TableCell>Meeting Link</TableCell>
								<TableCell>{student.meetingLink}</TableCell>
							</TableRow>
						)}
						{student.mentorId && (
							<TableRow>
								<TableCell>Mentor ID</TableCell>
								<TableCell>{student.mentorId}</TableCell>
							</TableRow>
						)}
						{student.supervisorId && (
							<TableRow>
								<TableCell>Supervisor ID</TableCell>
								<TableCell>{student.supervisorId}</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>

				{address && (
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
				)}

				{notes.length > 0 && (
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
										<TableRow key={idx as number}>
											<TableCell>{note.text}</TableCell>
											<TableCell>{note.writterBy}</TableCell>
											<TableCell>{formatDate(note.createdAt)}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}
			</CardContent>
		</Card>
	);
}

export function TeacherProfile({
	teacher,
}: {
	teacher?: SelectTeacherType | null;
}) {
	if (!teacher) return null;

	const experiences = (teacher.experiences ?? []) as Experience[];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Teacher Details</CardTitle>
				<CardDescription>Supervisor, languages, and experience</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableBody>
						{teacher.supervisorId && (
							<TableRow>
								<TableCell>Supervisor ID</TableCell>
								<TableCell>{teacher.supervisorId}</TableCell>
							</TableRow>
						)}
						<TableRow>
							<TableCell>Languages</TableCell>
							<TableCell>
								{teacher.languages?.length
									? teacher.languages.map((lang) => (
											<ColorBadge key={lang}>{lang}</ColorBadge>
										))
									: "None"}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>

				{experiences.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Experiences</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Title</TableHead>
										<TableHead>Organization</TableHead>
										<TableHead>Period</TableHead>
										<TableHead>Description</TableHead>
										<TableHead>Written By</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{experiences.map((exp, idx) => (
										<TableRow key={idx as number}>
											<TableCell>{exp.title}</TableCell>
											<TableCell>{exp.organization}</TableCell>
											<TableCell>
												{formatDate(exp.startedAt)} -{" "}
												{exp.endedAt ? formatDate(exp.endedAt) : "Present"}
											</TableCell>
											<TableCell>{exp.description ?? "—"}</TableCell>
											<TableCell>{exp.writtenBy}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				)}
			</CardContent>
		</Card>
	);
}

export function SchedulerProfile({
	scheduler,
}: {
	scheduler?: SelectSchedulerType | null;
}) {
	if (!scheduler) return null;
	return (
		<Card>
			<CardHeader>
				<CardTitle>Scheduler Details</CardTitle>
				<CardDescription>Schedule coordinator profile</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableBody>
						<TableRow>
							<TableCell>Scheduler ID</TableCell>
							<TableCell>{scheduler.id}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Created At</TableCell>
							<TableCell>{formatDate(scheduler.createdAt)}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Updated At</TableCell>
							<TableCell>{formatDate(scheduler.updatedAt)}</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

export function ProfileCard({
	user,
	student,
	teacher,
	scheduler,
}: {
	user: SelectUserType;
	student?: SelectStudentType | null;
	teacher?: SelectTeacherType | null;
	scheduler?: SelectSchedulerType | null;
}) {
	return (
		<Card>
			<CardHeader>
				<Avatar size="lg">
					{user.image && <AvatarImage src={user.image} alt={user.name} />}
					<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
					<AvatarBadge />
				</Avatar>
				<CardTitle>{user.name}</CardTitle>
				<CardDescription>{user.email}</CardDescription>
				{user.role && <ColorBadge>{snakeToTitleCase(user.role)}</ColorBadge>}
				<ColorBadge variant={user.emailVerified ? "success" : "warning"}>
					{user.emailVerified ? "Verified" : "Unverified"}
				</ColorBadge>
				{user.banned && <ColorBadge variant="destructive">Banned</ColorBadge>}
			</CardHeader>

			<CardContent>
				{user.banned && (
					<Alert variant="destructive">
						<AlertTitle>Banned</AlertTitle>
						<AlertDescription>
							{user.banReason ? `Reason: ${user.banReason}. ` : ""}
							{user.banExpires
								? `Expires: ${formatDate(user.banExpires)}`
								: "Permanent"}
						</AlertDescription>
					</Alert>
				)}

				<Table>
					<TableBody>
						<TableRow>
							<TableCell>User ID</TableCell>
							<TableCell>{user.id}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Created At</TableCell>
							<TableCell>{formatDate(user.createdAt)}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Updated At</TableCell>
							<TableCell>{formatDate(user.updatedAt)}</TableCell>
						</TableRow>
					</TableBody>
				</Table>

				<Separator />
				<SwitchNode
					cases={user.role}
					student={<StudentProfile student={student} />}
					teacher={<TeacherProfile teacher={teacher} />}
					scheduler={<SchedulerProfile scheduler={scheduler} />}
				/>
			</CardContent>
		</Card>
	);
}

export default ProfileCard;
