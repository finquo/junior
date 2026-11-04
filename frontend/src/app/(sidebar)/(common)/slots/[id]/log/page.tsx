"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Trace,
	TraceCollapsible,
	TraceCollapsibleContent,
	TraceCollapsibleTrigger,
	TraceDescription,
	TraceLine,
	TraceTitle,
} from "@/components/ui/trace";
import { api } from "@/hooks/api";

function formatDateTime(value: Date | string) {
	return new Date(value).toLocaleString([], {
		dateStyle: "medium",
		timeStyle: "medium",
	});
}

function SlotLog({ slotId }: { slotId: string }) {
	const {
		data = [],
		isPending,
		isError,
	} = useQuery(api.meeting.log.queryOptions({ input: { id: slotId } }));

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Log Unavailable</AlertTitle>
				<AlertDescription>
					The event log for this session could not be loaded.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Session Log</CardTitle>
				<CardDescription>
					Every Zoom event recorded for this session, newest first.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{!isPending && data.length === 0 && (
					<Alert>
						<AlertTitle>No events yet</AlertTitle>
						<AlertDescription>
							Events appear once the session starts.
						</AlertDescription>
					</Alert>
				)}
				{data.map((log) => (
					<Trace key={log.id}>
						<TraceCollapsible>
							<TraceCollapsibleTrigger>
								<TraceLine>
									<TraceTitle>{log.event}</TraceTitle>
									<TraceDescription>
										{formatDateTime(log.createdAt)}
									</TraceDescription>
								</TraceLine>
							</TraceCollapsibleTrigger>
							<TraceCollapsibleContent>
								<pre className="overflow-x-auto text-xs">
									{JSON.stringify(log.data, null, 2)}
								</pre>
							</TraceCollapsibleContent>
						</TraceCollapsible>
					</Trace>
				))}
			</CardContent>
		</Card>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const slotId = params?.id;

	if (!slotId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Session ID</AlertTitle>
				<AlertDescription>
					No session identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <SlotLog slotId={slotId} />;
}
