"use client";

import { useParams } from "next/navigation";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { TeacherProfile } from "../_components/profile";

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Teacher"
			api={api.core.teacher.get.queryOptions({ input: { id } })}
		>
			{(data) => <TeacherProfile data={data} />}
		</LoadQuery>
	);
}
