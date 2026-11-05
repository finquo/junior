import type { InferRouterOutputs } from "@orpc/server";
import type { appRouter } from "backend/api";
import { Badge } from "@/components/pdf/badge/badge";
import { DataTable } from "@/components/pdf/data-table/data-table";
import { KeyValue } from "@/components/pdf/key-value/key-value";
import { PageFooter } from "@/components/pdf/page-footer/page-footer";
import { PageHeader } from "@/components/pdf/page-header/page-header";
import { PageNumber } from "@/components/pdf/page-number/page-number";
import { Section } from "@/components/pdf/section/section";
import { Text } from "@/components/pdf/text/text";
import { usePdfcnTheme } from "@/components/pdf/theme-provider";
import { Document, Page, StyleSheet, View } from "@/lib/pdf-primitives";

type StudentReportData = InferRouterOutputs<
	typeof appRouter
>["analytics"]["studentReport"];

const NOT_PROVIDED = "Not provided - edit from dashboard";

const formatDate = (value: Date | string | null | undefined) => {
	if (!value) {
		return NOT_PROVIDED;
	}
	return new Date(value).toLocaleDateString("en-IN", { dateStyle: "medium" });
};

const formatDateTime = (value: Date | string | null | undefined) => {
	if (!value) {
		return NOT_PROVIDED;
	}
	return new Date(value).toLocaleString("en-IN", {
		dateStyle: "medium",
		timeStyle: "short",
	});
};

export const StudentReport = ({ data }: { data: StudentReportData }) => {
	const theme = usePdfcnTheme();
	const { student, attendedLessons, slots, payments, materials, answers } =
		data;

	const styles = StyleSheet.create({
		metricCard: {
			backgroundColor: theme.colors.background,
			borderColor: theme.colors.border,
			borderRadius: theme.primitives.borderRadius.md,
			borderStyle: "solid",
			borderWidth: 1,
			padding: 8,
			width: "48.6%",
		},
		metricLabel: {
			color: theme.colors.mutedForeground,
			fontSize: 8,
			letterSpacing: 0.5,
			marginBottom: 2,
			textTransform: "uppercase",
		},
		metricValue: {
			color: theme.colors.foreground,
			fontSize: 14,
			fontWeight: theme.primitives.fontWeights.bold,
		},
		metricsGrid: {
			flexDirection: "row",
			flexWrap: "wrap",
			gap: 8,
		},
		page: {
			backgroundColor: theme.colors.background,
			boxSizing: "border-box",
			minHeight: 841,
			paddingBottom: theme.spacing.page.marginBottom,
			paddingLeft: theme.spacing.page.marginLeft,
			paddingRight: theme.spacing.page.marginRight,
			paddingTop: theme.spacing.page.marginTop,
			position: "relative",
		},
		pageBreak: {
			breakAfter: "page",
		},
		toolbar: {
			alignItems: "center",
			flexDirection: "row",
			justifyContent: "space-between",
			marginBottom: 8,
		},
	});

	const studentName = student.user?.name ?? NOT_PROVIDED;
	const programName = student.programInfo?.name ?? NOT_PROVIDED;
	const mentorName = student.mentor?.user?.name ?? NOT_PROVIDED;
	const supervisorName = student.scheduler?.user?.name ?? NOT_PROVIDED;
	const email = student.user?.email ?? NOT_PROVIDED;
	const age = String(student.age ?? NOT_PROVIDED);
	const grade = String(student.grade ?? NOT_PROVIDED);
	const schooling = student.schooling ?? NOT_PROVIDED;
	const country = student.country ?? NOT_PROVIDED;
	const languageList = student.languages ?? [];
	const languages =
		languageList.length > 0 ? languageList.join(", ") : NOT_PROVIDED;
	const addressText = student.address
		? [
				student.address.line1,
				student.address.line2,
				student.address.city,
				student.address.state,
				student.address.postalCode,
				student.address.country,
			]
				.filter(Boolean)
				.join(", ")
		: NOT_PROVIDED;
	const paidTone = student.paid ? "success" : "warning";
	const paidLabel = student.paid ? "Paid" : "Payment Pending";
	const totalFee = `${student.currency} ${student.amount}`;
	const remaining = `${student.currency} ${student.remaining}`;

	const lessonRows = attendedLessons.map((lesson) => ({
		name: lesson.name,
		language: lesson.language,
		description: lesson.description ?? NOT_PROVIDED,
	}));

	const slotRows = slots.map((slot) => ({
		start: formatDateTime(slot.startTime),
		expectedEnd: formatDateTime(slot.expectedEndTime),
		ended: formatDateTime(slot.endTime),
		status: slot.status,
	}));

	const paymentRows = payments.map((payment) => ({
		paidAt: formatDate(payment.paidAt),
		amount: `${payment.currency} ${payment.amount}`,
		transactionId: payment.transactionId ?? NOT_PROVIDED,
	}));

	const materialRows = materials.map((material) => ({
		name: material.name,
		order: material.order,
		city: material.shippingAddress.city,
		createdAt: formatDate(material.createdAt),
	}));

	const answerRows = answers.map((answer) => ({
		status: answer.status,
		updatedAt: formatDate(answer.updatedAt),
	}));

	const noteRows = student.notes.map((note) => ({
		text: note.text,
		writtenBy: note.writterBy,
		createdAt: formatDate(note.createdAt),
	}));

	return (
		<Document title={`Student Report ${studentName}`}>
			<Page size="A4" style={[styles.page, styles.pageBreak]}>
				<PageHeader
					variant="two-column"
					title={studentName}
					subtitle={`Student Progress Report · ${programName}`}
					rightText={`Enrolled ${formatDate(student.createdAt)}`}
					rightSubText={`Generated ${formatDate(data.generatedAt)}`}
					marginBottom={14}
				/>

				<View style={styles.toolbar}>
					<Badge label={paidLabel} variant={paidTone} size="sm" />
					<Text variant="xs" color="mutedForeground" noMargin>
						{email}
					</Text>
				</View>

				<Section variant="card" padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Executive Summary
					</Text>
					<View style={styles.metricsGrid}>
						<View style={styles.metricCard}>
							<Text style={styles.metricLabel} noMargin>
								Total Fee
							</Text>
							<Text style={styles.metricValue} noMargin>
								{totalFee}
							</Text>
						</View>
						<View style={styles.metricCard}>
							<Text style={styles.metricLabel} noMargin>
								Remaining
							</Text>
							<Text style={styles.metricValue} noMargin>
								{remaining}
							</Text>
						</View>
						<View style={styles.metricCard}>
							<Text style={styles.metricLabel} noMargin>
								Lessons Attended
							</Text>
							<Text style={styles.metricValue} noMargin>
								{String(attendedLessons.length)}
							</Text>
						</View>
						<View style={styles.metricCard}>
							<Text style={styles.metricLabel} noMargin>
								Scheduled Slots
							</Text>
							<Text style={styles.metricValue} noMargin>
								{String(slots.length)}
							</Text>
						</View>
					</View>
				</Section>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Student Profile
					</Text>
					<KeyValue
						size="sm"
						divided
						items={[
							{ key: "Email", value: email },
							{ key: "Age", value: age },
							{ key: "Grade", value: grade },
							{ key: "Schooling", value: schooling },
							{ key: "Country", value: country },
							{ key: "Languages", value: languages },
							{ key: "Address", value: addressText },
							{ key: "Program", value: programName },
							{ key: "Mentor", value: mentorName },
							{ key: "Supervisor", value: supervisorName },
						]}
					/>
				</Section>

				<PageFooter
					variant="three-column"
					leftText="Confidential — Internal Use"
					centerText="Generated with pdfcn"
					rightText={<PageNumber size="xs" />}
					sticky
					pagePadding={theme.spacing.page.marginLeft}
				/>
			</Page>

			<Page size="A4" style={[styles.page, styles.pageBreak]}>
				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Attended Lessons
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={[
							{ header: "Lesson", key: "name" },
							{ header: "Language", key: "language" },
							{ header: "Description", key: "description" },
						]}
						data={lessonRows}
					/>
				</Section>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Class Schedule
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={[
							{ header: "Start", key: "start" },
							{ header: "Expected End", key: "expectedEnd" },
							{ header: "Ended", key: "ended" },
							{ align: "center", header: "Status", key: "status" },
						]}
						data={slotRows}
					/>
				</Section>

				<PageFooter
					variant="three-column"
					leftText="Confidential — Internal Use"
					centerText="Generated with pdfcn"
					rightText={<PageNumber size="xs" />}
					sticky
					pagePadding={theme.spacing.page.marginLeft}
				/>
			</Page>

			<Page size="A4" style={styles.page}>
				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Payments
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={[
							{ header: "Paid On", key: "paidAt" },
							{ align: "right", header: "Amount", key: "amount" },
							{ header: "Transaction", key: "transactionId" },
						]}
						data={paymentRows}
					/>
				</Section>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Study Materials
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={[
							{ header: "Material", key: "name" },
							{ align: "center", header: "Order", key: "order" },
							{ header: "Shipped To", key: "city" },
							{ header: "Ordered On", key: "createdAt" },
						]}
						data={materialRows}
					/>
				</Section>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Answers
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={[
							{ align: "center", header: "Status", key: "status" },
							{ header: "Updated On", key: "updatedAt" },
						]}
						data={answerRows}
					/>
				</Section>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Staff Notes
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={[
							{ header: "Note", key: "text" },
							{ header: "Written By", key: "writtenBy" },
							{ header: "Date", key: "createdAt" },
						]}
						data={noteRows}
					/>
				</Section>

				<PageFooter
					variant="three-column"
					leftText="Confidential — Internal Use"
					centerText="Generated with pdfcn"
					rightText={<PageNumber size="xs" />}
					sticky
					pagePadding={theme.spacing.page.marginLeft}
				/>
			</Page>
		</Document>
	);
};
