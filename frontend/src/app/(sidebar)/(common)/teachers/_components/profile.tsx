"use client";

import { CalendarIcon, PenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
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
import { EditTeacherDrawer } from "./edit-drawer";

type TeacherData = NonNullable<API_Returns["core"]["teacher"]["get"]>;

export function TeacherProfile({ data }: { data: TeacherData }) {
	const experiences = data.experiences ?? [];

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
							<ColorBadge variant="info">Teacher</ColorBadge>
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
					<Button
						variant="outline"
						size="sm"
						nativeButton={false}
						render={<Link href={`/slots/${data.id}`} />}
					>
						<CalendarIcon />
						View Sessions
					</Button>

					<RenderWhenRole role={["admin", "scheduler"]}>
						<EditTeacherDrawer teacher={data}>
							<Button variant="outline" size="sm">
								<PenIcon />
								Edit
							</Button>
						</EditTeacherDrawer>
					</RenderWhenRole>
				</CardAction>
			</CardHeader>

			<CardContent>
				<Table>
					<TableBody>
						<TableRow>
							<TableCell>Teacher ID</TableCell>
							<TableCell>{data.id}</TableCell>
						</TableRow>
						{data.supervisorId && (
							<TableRow>
								<TableCell>Supervisor ID</TableCell>
								<TableCell>{data.supervisorId}</TableCell>
							</TableRow>
						)}
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
							<TableCell>Joined</TableCell>
							<TableCell>{formatDate(data.createdAt)}</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Last Updated</TableCell>
							<TableCell>{formatDate(data.updatedAt)}</TableCell>
						</TableRow>
					</TableBody>
				</Table>

				<Separator />
				<Card>
					<CardHeader>
						<CardTitle>Experiences</CardTitle>
						<CardAction>
							<Button variant="outline" size="sm">
								<PlusIcon />
								Add Experience
							</Button>
						</CardAction>
					</CardHeader>
					<CardContent>
						{experiences.length === 0 ? (
							<Alert>
								<AlertTitle>No experiences</AlertTitle>
								<AlertDescription>
									No previous experience records listed for this teacher.
								</AlertDescription>
							</Alert>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Title</TableHead>
										<TableHead>Organization</TableHead>
										<TableHead>Period</TableHead>
										<TableHead>Description</TableHead>
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
