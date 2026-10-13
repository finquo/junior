"use client";

import { useQuery } from "@tanstack/react-query";
import type { LeaveRangeOutput } from "backend/config";
import { PlusIcon } from "lucide-react";
import { getRangeTime } from "utils";
import Loader from "@/components/loader";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ColorBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/hooks/api";
import { AddLeaveDrawer } from "../_components/leave";

function formatLeaveDate(
	date: Date | string,
	type: "full" | "multiple" | "partial",
) {
	const d = new Date(date);
	if (type === "partial") {
		return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
	}
	return d.toLocaleDateString();
}

export function LeavesCard({
	initial: leaves = [],
}: {
	initial?: LeaveRangeOutput[] | null;
}) {
	return (
		<Frame className="flex-1">
			<FrameHeader>
				<FrameTitle>Leaves</FrameTitle>
				<FrameDescription>View and manage your leaves</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						<AddLeaveDrawer>
							<Button size="sm">
								<PlusIcon />
								Add Leave
							</Button>
						</AddLeaveDrawer>
					</ButtonGroup>
				</FrameActions>
			</FrameHeader>

			<FramePanel>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Type</TableHead>
							<TableHead>Range</TableHead>
							<TableHead>Starting From</TableHead>
							<TableHead>Ending On</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{!leaves || leaves.length === 0 ? (
							<TableRow>
								<TableCell colSpan={4}>No leave dates recorded.</TableCell>
							</TableRow>
						) : (
							leaves.map((leave, i) => (
								<TableRow key={i as number}>
									<TableCell>
										<ColorBadge>{leave.type}</ColorBadge>
									</TableCell>
									<TableCell>{getRangeTime(leave.start, leave.end)}</TableCell>
									<TableCell>
										{formatLeaveDate(leave.start, leave.type)}
									</TableCell>
									<TableCell>
										{formatLeaveDate(leave.end, leave.type)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</FramePanel>
		</Frame>
	);
}

export default function Page() {
	const { data, isPending, isError } = useQuery(
		api.core.self.teacher.queryOptions(),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Error loading profile</AlertTitle>
				<AlertDescription>Unable to retrieve teacher leave.</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="flex flex-col flex-wrap items-start gap-3 md:flex-row">
			<LeavesCard initial={data?.leaves} />
		</div>
	);
}
