"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import {
	Frame,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { MaterialProfile } from "../_components/profile";

function Material({ materialId }: { materialId: string }) {
	const { data, isPending, isError } = useQuery(
		api.core.material.get.queryOptions({
			input: { id: materialId },
		}),
	);

	if (isPending) return <Loader />;

	if (isError || !data) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Material Not Found</AlertTitle>
				<AlertDescription>
					The requested material could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>{data.name}</FrameTitle>
				<FrameDescription>Material order details</FrameDescription>
			</FrameHeader>
			<FramePanel>
				<MaterialProfile data={data} />
			</FramePanel>
		</Frame>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const materialId = params?.id;

	if (!materialId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Material ID</AlertTitle>
				<AlertDescription>
					No material identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <Material materialId={materialId} />;
}
