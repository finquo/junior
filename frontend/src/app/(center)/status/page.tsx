"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/hooks/api";

export default function Home() {
	const { data, isFetching, isError } = useQuery(api.health.queryOptions());

	return (
		<Card>
			<CardHeader>
				<CardTitle>API Status</CardTitle>
				<CardDescription>Please wait</CardDescription>
				<CardAction>
					{isFetching && (
						<Button variant={"outline"} size={"icon-xs"}>
							<Loader2 className="animate-spin" />
						</Button>
					)}
					{data && <Badge variant={"green"}>Connected</Badge>}
					{isError && <Badge variant={"red"}>Not Connected</Badge>}
				</CardAction>
			</CardHeader>
		</Card>
	);
}
