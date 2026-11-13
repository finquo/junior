"use client";

import { useParams } from "next/navigation";
import { Container } from "@/components/container";
import Loader from "@/components/loader";
import { CallGate } from "./_components/gate";

export default function Page() {
	const params = useParams<{ id: string }>();
	const id = params?.id;

	if (!id) return <Loader />;

	return (
		<Container>
			<CallGate id={id} />
		</Container>
	);
}
