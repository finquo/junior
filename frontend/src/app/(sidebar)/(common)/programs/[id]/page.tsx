"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { ProgramProfile } from "./_components/profile";

function Program({ programId }: { programId: string }) {
	const programQuery = useQuery(
		api.core.program.get.queryOptions({
			input: { id: programId },
		}),
	);
	const studentsQuery = useQuery(
		api.core.program.students.queryOptions({
			input: { id: programId },
		}),
	);
	const lessonsQuery = useQuery(
		api.core.program.lessons.queryOptions({
			input: { id: programId },
		}),
	);

	if (programQuery.isPending) {
		return <Loader />;
	}

	if (programQuery.isError || !programQuery.data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Program Not Found</AlertTitle>
				<AlertDescription>
					The requested program could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<ProgramProfile
			data={programQuery.data}
			students={studentsQuery.data ?? []}
			lessons={lessonsQuery.data ?? []}
			studentsPending={studentsQuery.isPending}
			lessonsPending={lessonsQuery.isPending}
		/>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const programId = params?.id;

	if (!programId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Program</AlertTitle>
				<AlertDescription>
					No valid program identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Program programId={programId} />;
}
