"use client";

import { PenIcon } from "lucide-react";
import { ProfileCard, StudentProfile } from "@/components/profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DrawerTrigger } from "@/components/ui/drawer";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import type { API_Returns } from "@/lib/api";
import { formatDate, snakeToTitleCase } from "@/lib/utils";
import { LessonProfile } from "../../lessons/_components/profile";
import { EditMaterialDrawer } from "./edit-drawer";

type MaterialData = NonNullable<API_Returns["core"]["material"]["get"]>;

export function MaterialProfile({ data }: { data: MaterialData }) {
	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{data.name}</CardTitle>
					<CardDescription>{data.id}</CardDescription>
					<CardAction>
						<EditMaterialDrawer material={data}>
							<DrawerTrigger asChild>
								<Button variant="outline" size="sm">
									<PenIcon />
									Edit
								</Button>
							</DrawerTrigger>
						</EditMaterialDrawer>
					</CardAction>
				</CardHeader>
				<CardContent>
					<Table>
						<TableBody>
							<TableRow>
								<TableCell>Order Status</TableCell>
								<TableCell>
									<Badge variant="outline">
										{snakeToTitleCase(data.order)}
									</Badge>
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Scheduler</TableCell>
								<TableCell>{data.scheduler?.user?.name ?? null}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Created At</TableCell>
								<TableCell>{formatDate(data.createdAt)}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Updated At</TableCell>
								<TableCell>{formatDate(data.updatedAt)}</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Shipping Address</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableBody>
							<TableRow>
								<TableCell>Street Line 1</TableCell>
								<TableCell>{data.shippingAddress.line1}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Street Line 2</TableCell>
								<TableCell>{data.shippingAddress.line2 ?? null}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>City</TableCell>
								<TableCell>{data.shippingAddress.city}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>State</TableCell>
								<TableCell>{data.shippingAddress.state}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Postal Code</TableCell>
								<TableCell>{data.shippingAddress.postalCode}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell>Country</TableCell>
								<TableCell>{data.shippingAddress.country}</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{data.student?.user && (
				<ProfileCard user={data.student.user} student={data.student} />
			)}
			{data.student && <StudentProfile student={data.student} />}

			{data.lessonList.map((lesson) => (
				<LessonProfile key={lesson.id} data={lesson} />
			))}
		</>
	);
}
