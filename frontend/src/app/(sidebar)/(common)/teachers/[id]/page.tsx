"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { TeacherProfile } from "../_components/profile";

function Teacher({ teacherId }: { teacherId: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.teacher.get.queryOptions({
			input: { id: teacherId },
		}),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Teacher Not Found</AlertTitle>
				<AlertDescription>
					The requested teacher profile could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return <TeacherProfile data={data} />;
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const teacherId = params?.id;

	if (!teacherId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Teacher ID</AlertTitle>
				<AlertDescription>
					No teacher identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Teacher teacherId={teacherId} />;
}
