"use client";

import { api } from "@/hooks/api";
import { LoadQuery } from "@/hooks/load";
import { LeavesCard } from "./_components";

export default function Page() {
	return (
		<LoadQuery label="Teacher Profile" api={api.core.self.teacher.queryOptions()}>
			{(data) => (
				<div className="flex flex-col flex-wrap items-start gap-3 md:flex-row">
					<LeavesCard initial={data?.leaves} />
				</div>
			)}
		</LoadQuery>
	);
}
