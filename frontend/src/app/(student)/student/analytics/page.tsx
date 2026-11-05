"use client";

import Loader from "@/components/loader";
import { useAuth } from "@/hooks/auth";

export default function Page() {
	const { user } = useAuth();

	if (!user) {
		return <Loader />;
	}

	return (
		<iframe
			title="PDF"
			src={`/analytics/students/${user.id}`}
			className="h-full w-full"
		/>
	);
}
