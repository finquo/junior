"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowLeftIcon,
	BanknoteIcon,
	CircleAlertIcon,
	CircleCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCurrencySymbol } from "utils";
import Loader from "@/components/loader";
import { ProgramLink } from "@/components/program";
import {
	Frame,
	FrameActions,
	FrameDescription,
	FrameHeader,
	FramePanel,
	FrameTitle,
} from "@/components/reui/frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { api } from "@/hooks/api";
import { useHasRole } from "@/hooks/role";
import { PaymentLog } from "./_components/payment-log";
import { RecordPayment } from "./_components/record-payment";

function Payments({ studentId }: { studentId: string }) {
	const {
		data: student,
		isPending,
		isError,
	} = useQuery(api.core.student.get.queryOptions({ input: { id: studentId } }));
	const { data: payments = [] } = useQuery(
		api.core.student.getPayments.queryOptions({ input: { id: studentId } }),
	);

	const isAdmin = useHasRole("admin");

	if (isPending) {
		return <Loader />;
	}

	if (isError || !student) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Student Not Found</AlertTitle>
				<AlertDescription>
					The requested student profile could not be loaded or does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	const currency = student.currency ?? "INR";
	const symbol = getCurrencySymbol(currency);
	const paidSoFar = Math.max(
		(student.amount ?? 0) - (student.remaining ?? 0),
		0,
	);

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Payments</FrameTitle>
				<FrameDescription>
					Manage the program fees and payment history
				</FrameDescription>
				<FrameActions>
					<Button asChild variant="outline">
						<Link href={`/students/${studentId}` as "/"}>
							<ArrowLeftIcon />
							Profile
						</Link>
					</Button>
				</FrameActions>
			</FrameHeader>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Fee Summary</FrameTitle>
					<FrameDescription>
						The current state of the program fees
					</FrameDescription>
				</FrameHeader>
				<ItemGroup>
					<Item variant="outline">
						<ItemMedia variant="icon">
							<BanknoteIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Total Amount</ItemTitle>
							<ItemDescription>
								{symbol}
								{student.amount ?? 0} due for{" "}
								<ProgramLink id={student.program} />
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Badge variant={student.paid ? "success" : "warning"}>
								{student.paid ? <CircleCheckIcon /> : <CircleAlertIcon />}
								{student.paid ? "Fully Paid" : "Pending"}
							</Badge>
						</ItemActions>
					</Item>

					<Item variant="outline">
						<ItemMedia variant="icon">
							<CircleCheckIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Paid So Far</ItemTitle>
							<ItemDescription>
								{symbol}
								{paidSoFar}
								{payments.length > 0 &&
									` · across ${payments.length} payment${payments.length > 1 ? "s" : ""}`}
							</ItemDescription>
						</ItemContent>
					</Item>

					<Item variant="outline">
						<ItemMedia variant="icon">
							<CircleAlertIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Remaining</ItemTitle>
							<ItemDescription>
								{student.remaining
									? `${symbol}${student.remaining} left to pay`
									: "Nothing left to pay"}
							</ItemDescription>
						</ItemContent>
					</Item>
				</ItemGroup>
			</FramePanel>

			{isAdmin && (
				<FramePanel>
					<FrameHeader>
						<FrameTitle>Record a Payment</FrameTitle>
						<FrameDescription>
							Log an offline payment received from the parents
						</FrameDescription>
					</FrameHeader>
					<RecordPayment
						id={studentId}
						remaining={student.remaining ?? 0}
						currency={currency}
					/>
				</FramePanel>
			)}

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Payment History</FrameTitle>
					<FrameDescription>
						Offline payments recorded for this student
					</FrameDescription>
				</FrameHeader>
				<PaymentLog id={studentId} payments={payments} />
			</FramePanel>
		</Frame>
	);
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

	return <Payments studentId={studentId} />;
}
