"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";
import type { API_Returns } from "@/lib/api";

type ProgramData = NonNullable<API_Returns["core"]["program"]["get"]>;

function ProgramLinkContent({
	id,
	name,
}: {
	id: string;
	name?: string | null;
}) {
	const { data, isPending } = useQuery({
		...api.core.program.get.queryOptions({ input: { id } }),
		enabled: !name,
	});

	if (!name && isPending) {
		return <Skeleton className="h-6 w-28" />;
	}

	return (
		<Button variant="outline" size="sm" asChild>
			<Link href={`/programs/${id}`}>{name ?? data?.name ?? id}</Link>
		</Button>
	);
}

export function ProgramLink({
	id,
	name,
	placeholder,
}: {
	id?: string | null;
	name?: string | null;
	placeholder?: ReactNode;
}) {
	if (!id) return <>{placeholder ?? null}</>;
	return <ProgramLinkContent id={id} name={name} />;
}

export const FetchProgram = (props: {
	id?: string | null;
	isPending?: ReactNode;
	isError?: ReactNode;
	notFound?: ReactNode;
	children: (program: ProgramData) => ReactNode;
}) => {
	if (!props.id) return null;

	const { data, isPending, isError } = useQuery(
		api.core.program.get.queryOptions({
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
