"use client";

import { useParams } from "next/navigation";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { SchedulerProfile } from "../_components/profile";

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Scheduler"
			api={api.core.scheduler.get.queryOptions({ input: { id } })}
		>
			{(data) => <SchedulerProfile data={data} />}
		</LoadQuery>
	);
}
