"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { VideoProfile } from "../_components/profile";

function Video({ id }: { id: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.video.get.queryOptions({ input: { id } }),
	);

	if (isPending) return <Loader />;

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Video Not Found</AlertTitle>
				<AlertDescription>
					The requested video could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return <VideoProfile data={data} />;
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const id = params?.id;

	if (!id) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Video</AlertTitle>
				<AlertDescription>
					No valid video identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Video id={id} />;
}
