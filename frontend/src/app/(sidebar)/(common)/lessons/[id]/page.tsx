"use client";

import { useParams } from "next/navigation";
import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { LessonProfile } from "../_components/profile";

export default function Page() {
	const id = useParams<{ id: string }>().id;

	return (
		<LoadQuery
			label="Lesson"
			api={api.core.lesson.get.queryOptions({ input: { id } })}
		>
			{(data) => <LessonProfile data={data} />}
		</LoadQuery>
	);
}
