"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { StudentProfile } from "../_components/profile";

function Student({ studentId }: { studentId: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.student.get.queryOptions({
			input: { id: studentId },
		}),
	);
	const { data: curriculum } = useQuery(
		api.core.student.getCurriculum.queryOptions({
			input: { id: studentId },
		}),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Student Not Found</AlertTitle>
				<AlertDescription>
					The requested student profile could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return <StudentProfile data={data} curriculum={curriculum} />;
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const studentId = params?.id;

	if (!studentId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Student ID</AlertTitle>
				<AlertDescription>
					No student identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Student studentId={studentId} />;
}
