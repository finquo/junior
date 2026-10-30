"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/hooks/api";

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
