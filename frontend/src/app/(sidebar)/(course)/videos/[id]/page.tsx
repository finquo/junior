"use client";

import { useParams } from "next/navigation";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { VideoProfile } from "../_components/profile";

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Video"
			api={api.core.video.get.queryOptions({ input: { id } })}
		>
			{(data) => <VideoProfile data={data} />}
		</LoadQuery>
	);
}
