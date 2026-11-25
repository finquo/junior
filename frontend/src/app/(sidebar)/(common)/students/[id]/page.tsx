"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import type { API_Returns } from "@/lib/api";
import { StudentProfile } from "../_components/profile";

type StudentData = NonNullable<API_Returns["core"]["student"]["get"]>;

function StudentDetail({ data }: { data: StudentData }) {
	const { data: curriculum } = useQuery(
		api.core.student.getCurriculum.queryOptions({
			input: { id: data.id },
		}),
	);

	return <StudentProfile data={data} curriculum={curriculum} />;
}

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Student"
			api={api.core.student.get.queryOptions({ input: { id } })}
		>
			{(data) => <StudentDetail data={data} />}
		</LoadQuery>
	);
}
