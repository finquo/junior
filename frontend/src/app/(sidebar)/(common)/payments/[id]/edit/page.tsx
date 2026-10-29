"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/hooks/api";
import { EditPaymentForm } from "../../_components/payment-form";

function EditPayment({ paymentId }: { paymentId: string }) {
	const {
		data: payment,
		isPending,
		isError,
	} = useQuery(api.core.payment.get.queryOptions({ input: { id: paymentId } }));

	const { data: student } = useQuery(
		api.core.student.get.queryOptions({
			...{ input: { id: payment?.studentId ?? "" } },
			enabled: Boolean(payment?.studentId),
		}),
	);

	if (isPending) {
		return <Loader />;
	}

	if (isError || !payment) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Payment Not Found</AlertTitle>
				<AlertDescription>
					The requested payment could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Edit Payment</FrameTitle>
				<FrameDescription>
					Update the payment details; the student balance follows the amount
				</FrameDescription>
				<FrameActions>
					<Button asChild variant="outline">
						<Link href={`/payments/${payment.id}` as "/"}>
							<ArrowLeftIcon />
							Payment
						</Link>
					</Button>
				</FrameActions>
			</FrameHeader>
			{student && (
				<FramePanel>
					<EditPaymentForm
						payment={payment}
						remaining={student.remaining ?? 0}
					/>
				</FramePanel>
			)}
		</Frame>
	);
}

export default function Page() {
	const params = useParams<{ id: string }>();
	const paymentId = params?.id;

	if (!paymentId) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Invalid Payment ID</AlertTitle>
				<AlertDescription>
					No payment identifier was found in the URL.
				</AlertDescription>
			</Alert>
		);
	}

	return <EditPayment paymentId={paymentId} />;
}
