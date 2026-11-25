"use client";

import { useParams } from "next/navigation";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { ModuleProfile } from "../_components/profile";

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Module"
			api={api.core.module.get.queryOptions({ input: { id } })}
		>
			{(module) => (
				<LoadQuery
					label="Video"
					api={api.core.video.list.queryOptions({
						input: { course: module.course, module: module.id },
					})}
				>
					{(videos) => <ModuleProfile data={module} videos={videos} />}
				</LoadQuery>
			)}
		</LoadQuery>
	);
}
