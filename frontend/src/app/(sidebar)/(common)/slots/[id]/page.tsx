"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { SessionProfile } from "../_components/session";

function Session({ slotId }: { slotId: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.slot.get.queryOptions({
			input: { id: slotId },
		}),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Session Not Found</AlertTitle>
				<AlertDescription>
					The requested session could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return <SessionProfile data={data} />;
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

	return <Session slotId={slotId} />;
}
