"use client";

import { useParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StudentLessons } from "../../../students/_components/lessons";

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

	return <StudentLessons studentId={studentId} />;
}
