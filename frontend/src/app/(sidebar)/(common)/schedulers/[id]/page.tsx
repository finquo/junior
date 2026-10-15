"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { SchedulerProfile } from "../_components/profile";

function Scheduler({ schedulerId }: { schedulerId: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.scheduler.get.queryOptions({
			input: { id: schedulerId },
		}),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Scheduler Not Found</AlertTitle>
				<AlertDescription>
					The requested scheduler profile could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return <SchedulerProfile data={data} />;
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const schedulerId = params?.id;

	if (!schedulerId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Scheduler ID</AlertTitle>
				<AlertDescription>
					No scheduler identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Scheduler schedulerId={schedulerId} />;
}
