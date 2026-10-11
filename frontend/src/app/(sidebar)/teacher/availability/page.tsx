"use client";

import { useQuery } from "@tanstack/react-query";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { AvailabilityCard } from "../_components/availability";
import { LeavesCard } from "../leave/page";

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
				<AlertDescription>
					Unable to retrieve teacher profile and availability.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="flex flex-col flex-wrap items-start gap-3 md:flex-row">
			<AvailabilityCard initial={data?.availability} />
			<LeavesCard initial={data?.leaves} />
		</div>
	);
}
