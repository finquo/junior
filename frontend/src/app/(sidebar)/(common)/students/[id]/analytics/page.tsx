"use client";

import { useParams } from "next/navigation";

export default function Page() {
	const params = useParams<{ id: string }>();

	return (
		<iframe
			title="PDF"
			src={`/analytics/students/${params.id}`}
			className="h-full w-full"
		/>
	);
}
