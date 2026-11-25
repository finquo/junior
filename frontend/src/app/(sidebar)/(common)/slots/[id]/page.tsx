"use client";

import { useParams } from "next/navigation";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { SessionProfile } from "../_components/session";

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Session"
			api={api.core.slot.get.queryOptions({ input: { id } })}
		>
			{(data) => <SessionProfile data={data} />}
		</LoadQuery>
	);
}
