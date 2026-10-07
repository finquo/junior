import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { API_Returns } from "@/lib/api";
import { api } from "./api";

export type LessonData = NonNullable<API_Returns["common"]["getLesson"]>;

export const FetchLesson = (props: {
	id?: string | null;
	isPending?: ReactNode;
	isError?: ReactNode;
	notFound?: ReactNode;
	children: (lesson: LessonData) => ReactNode;
}) => {
	if (!props.id) return null;

	const { data, isPending, isError } = useQuery(
		api.common.getLesson.queryOptions({
			input: { id: props.id },
		}),
	);

	if (isError && props.isError) return <>{props.isError}</>;

	if (isPending && props.isPending) return <>{props.isPending}</>;

	if (!data) {
		if (props.notFound) return <>{props.notFound}</>;
		return null;
	}

	return <>{props.children(data)}</>;
};
