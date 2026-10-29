"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
	ArrowLeftIcon,
	BanknoteIcon,
	CircleAlertIcon,
	CircleCheckIcon,
	PenIcon,
	Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { sileo as toast } from "sileo";
import { getCurrencySymbol, getRelateTime } from "utils";
import { CopyButton } from "@/components/copy";
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
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@/components/ui/item";
import { Spinner } from "@/components/ui/spinner";
import { api, refetchAPIs } from "@/hooks/api";
import { useHasRole } from "@/hooks/role";
import { FetchUser } from "@/hooks/user";

function Payment({ paymentId }: { paymentId: string }) {
	const {
		data: payment,
		isPending,
		isError,
	} = useQuery(api.core.payment.get.queryOptions({ input: { id: paymentId } }));

	const studentId = payment?.studentId;

	const { data: student } = useQuery(
		api.core.student.get.queryOptions({
			...{ input: { id: studentId ?? "" } },
			enabled: Boolean(studentId),
		}),
	);

	const isAdmin = useHasRole("admin");

	const { mutate: removePayment, isPending: isRemoving } = useMutation(
		api.core.payment.remove.mutationOptions({
			onSuccess: () => {
				refetchAPIs([
					api.core.payment.list.queryKey({ input: {} }),
					api.core.student.get.queryKey({
						input: { id: studentId ?? "" },
					}),
				]);
				toast.success({
					title: "Payment removed and remaining amount restored",
				});
			},
			onError: (error) => {
				toast.error({
					title: error.message || "Failed to remove payment",
				});
			},
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

	const symbol = getCurrencySymbol(payment.currency);

	return (
		<Frame>
			<FrameHeader>
				<FrameTitle>Payment</FrameTitle>
				<FrameDescription>
					Offline payment recorded for a student program
				</FrameDescription>
				<FrameActions>
					<ButtonGroup>
						{isRemoving && (
							<Button variant="outline" size="icon" disabled>
								<Spinner />
							</Button>
						)}
						<Button asChild variant="outline">
							<Link href="/payments">
								<ArrowLeftIcon />
								List
							</Link>
						</Button>
						{isAdmin && (
							<Button asChild>
								<Link href={`/payments/${payment.id}/edit` as "/"}>
									<PenIcon />
									Edit
								</Link>
							</Button>
						)}
					</ButtonGroup>
				</FrameActions>
			</FrameHeader>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Payment Details</FrameTitle>
					<FrameDescription>Recorded payment information</FrameDescription>
				</FrameHeader>
				<ItemGroup>
					<Item variant="outline">
						<ItemMedia variant="icon">
							<BanknoteIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Amount</ItemTitle>
							<ItemDescription>
								{symbol}
								{payment.amount.toLocaleString()} for{" "}
								<ProgramLink id={payment.program} />
							</ItemDescription>
						</ItemContent>
					</Item>

					<Item variant="outline">
						<ItemMedia variant="icon">
							<CircleCheckIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Paid On</ItemTitle>
							<ItemDescription>
								{payment.paidAt
									? format(new Date(payment.paidAt), "PPP")
									: "Not recorded"}
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Badge>
								{payment.currency} ·{" "}
								{getRelateTime(new Date(payment.createdAt))}
							</Badge>
						</ItemActions>
					</Item>

					<Item variant="outline">
						<ItemMedia variant="icon">
							<CircleAlertIcon />
						</ItemMedia>
						<ItemContent>
							<ItemTitle>Transaction</ItemTitle>
							<ItemDescription>
								{payment.transactionId ?? "No transaction reference"}
							</ItemDescription>
						</ItemContent>
						{payment.transactionId && (
							<ItemActions>
								<CopyButton
									text={() => payment.transactionId ?? ""}
									label="Transaction ID"
								/>
							</ItemActions>
						)}
					</Item>
				</ItemGroup>
			</FramePanel>

			<FramePanel>
				<FrameHeader>
					<FrameTitle>Student</FrameTitle>
					<FrameDescription>
						The program fees this payment counts against
					</FrameDescription>
				</FrameHeader>
				<ItemGroup>
					<Item variant="outline">
						<ItemContent>
							<ItemTitle>
								<Button variant="link" asChild>
									<Link href={`/students/${payment.studentId}` as "/"}>
										<FetchUser id={payment.studentId}>
											{(user) => user.name}
										</FetchUser>
									</Link>
								</Button>
							</ItemTitle>
							<ItemDescription>
								{symbol}
								{student?.remaining
									? `${student.remaining.toLocaleString()} remaining`
									: "Nothing left to pay"}
							</ItemDescription>
						</ItemContent>
						<ItemActions>
							<Badge variant={student?.paid ? "success" : "warning"}>
								{student?.paid ? <CircleCheckIcon /> : <CircleAlertIcon />}
								{student?.paid ? "Fully Paid" : "Pending"}
							</Badge>
						</ItemActions>
					</Item>
				</ItemGroup>
			</FramePanel>

			{isAdmin && (
				<FramePanel>
					<FrameHeader>
						<FrameTitle>Remove</FrameTitle>
						<FrameDescription>
							Deleting a payment restores the student's remaining balance
						</FrameDescription>
					</FrameHeader>
					<Button
						variant="destructive"
						onClick={() => removePayment({ id: payment.id })}
						disabled={isRemoving}
					>
						<Trash2Icon />
						Delete Payment
					</Button>
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

	return <Payment paymentId={paymentId} />;
}
