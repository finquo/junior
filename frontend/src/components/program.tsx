"use client";

import { useQuery } from "@tanstack/react-query";
import { GraduationCapIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
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
		<Button variant="ghost" size="sm" asChild>
			<Link href={`/programs/${id}`}>
				<GraduationCapIcon />
				{name ?? data?.name ?? id}
				<Badge variant="secondary" className="font-mono text-xs">
					{id}
				</Badge>
			</Link>
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
