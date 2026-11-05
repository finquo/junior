import type { InferRouterOutputs } from "@orpc/server";
import type { analyticsRouter } from "backend/api";
import { Badge } from "@/components/pdf/badge/badge";
import { DataTable } from "@/components/pdf/data-table/data-table";
import { PdfGraph } from "@/components/pdf/graph/graph";
import { PageFooter } from "@/components/pdf/page-footer/page-footer";
import { PageNumber } from "@/components/pdf/page-number/page-number";
import { Section } from "@/components/pdf/section/section";
import { Text } from "@/components/pdf/text/text";
import { usePdfcnTheme } from "@/components/pdf/theme-provider";
import { Document, Page, StyleSheet, View } from "@/lib/pdf-primitives";

type StudentReportData = InferRouterOutputs<
	typeof analyticsRouter
>["studentReport"];

const NOT_PROVIDED = "Not provided - edit from dashboard";

const PALETTE = [
	"#6366F1",
	"#10B981",
	"#F59E0B",
	"#F43F5E",
	"#0EA5E9",
	"#8B5CF6",
];

const UPCOMING_STATUSES = ["scheduled", "request_reschedule", "rescheduled"];

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

const countBy = <T,>(items: T[], pick: (item: T) => string) =>
	items.reduce<Record<string, number>>((acc, item) => {
		const key = pick(item);
		acc[key] = (acc[key] ?? 0) + 1;
		return acc;
	}, {});

export const StudentReport = ({ data }: { data: StudentReportData }) => {
	const theme = usePdfcnTheme();
	const { student, attendedLessons, slots, payments, materials, answers } =
		data;
	const now = new Date(data.generatedAt);

	const styles = StyleSheet.create({
		accentBar: {
			borderRadius: 2,
			height: 6,
		},
		accentBarTrack: {
			backgroundColor: theme.colors.muted,
			borderRadius: 2,
			height: 6,
			overflow: "hidden",
			width: "100%",
		},
		chartHalf: {
			flex: 1,
		},
		chartRow: {
			flexDirection: "row",
			gap: 12,
		},
		col: {
			flex: 1,
		},
		graphShell: {
			backgroundColor: theme.colors.background,
			borderColor: theme.colors.border,
			borderRadius: theme.primitives.borderRadius.md,
			borderStyle: "solid",
			borderWidth: 1,
			padding: 12,
		},
		hero: {
			backgroundColor: theme.colors.primary,
			borderRadius: theme.primitives.borderRadius.md,
			padding: 18,
		},
		heroMeta: {
			color: theme.colors.primaryForeground,
			fontSize: 9,
			marginTop: 2,
			opacity: 0.85,
		},
		heroName: {
			color: theme.colors.primaryForeground,
			fontSize: 22,
			fontWeight: theme.primitives.fontWeights.bold,
		},
		kpiCard: {
			borderRadius: theme.primitives.borderRadius.md,
			borderStyle: "solid",
			borderWidth: 1,
			padding: 10,
			width: "23.5%",
		},
		kpiLabel: {
			fontSize: 8,
			letterSpacing: 0.5,
			marginBottom: 4,
			textTransform: "uppercase",
		},
		kpiValue: {
			color: theme.colors.foreground,
			fontSize: 16,
			fontWeight: theme.primitives.fontWeights.bold,
		},
		profileCard: {
			borderRadius: theme.primitives.borderRadius.md,
			borderStyle: "solid",
			borderTopWidth: 3,
			borderWidth: 1,
			padding: 10,
			width: "31.8%",
		},
		profileGrid: {
			flexDirection: "row",
			flexWrap: "wrap",
			gap: 8,
		},
		profileLabel: {
			fontSize: 8,
			letterSpacing: 0.5,
			marginBottom: 3,
			textTransform: "uppercase",
		},
		profileValue: {
			color: theme.colors.foreground,
			fontSize: 10,
			fontWeight: theme.primitives.fontWeights.medium,
		},
		kpiRow: {
			flexDirection: "row",
			gap: 8,
		},
		page: {
			backgroundColor: theme.colors.background,
			boxSizing: "border-box",
			paddingBottom: 16,
			paddingLeft: 16,
			paddingRight: 16,
			paddingTop: 16,
			position: "relative",
		},
		personCard: {
			borderLeftWidth: 4,
			borderRadius: theme.primitives.borderRadius.md,
			borderStyle: "solid",
			padding: 10,
		},
		personName: {
			color: theme.colors.foreground,
			fontSize: 12,
			fontWeight: theme.primitives.fontWeights.bold,
		},
		personRole: {
			color: theme.colors.mutedForeground,
			fontSize: 8,
			letterSpacing: 0.5,
			marginBottom: 2,
			textTransform: "uppercase",
		},
		twoCol: {
			flexDirection: "row",
			gap: 12,
		},
	});

	const studentName = student.user?.name ?? NOT_PROVIDED;
	const programName = student.programInfo?.name ?? NOT_PROVIDED;
	const programDescription = student.programInfo?.description ?? undefined;
	const mentorName = student.mentor?.user?.name ?? NOT_PROVIDED;
	const mentorEmail = student.mentor?.user?.email ?? undefined;
	const supervisorName = student.scheduler?.user?.name ?? NOT_PROVIDED;
	const supervisorEmail = student.scheduler?.user?.email ?? undefined;
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

	const totalProgramLessons = student.programInfo?.lessons?.length ?? 0;
	const attendedCount = attendedLessons.length;
	const progressPercent =
		totalProgramLessons > 0
			? Math.min(100, Math.round((attendedCount / totalProgramLessons) * 100))
			: 0;

	const pastSlots = slots.filter((slot) => new Date(slot.startTime) < now);
	const attendedSlots = slots.filter((slot) => slot.status === "attended");
	const attendanceRate =
		pastSlots.length > 0
			? `${Math.round((attendedSlots.length / pastSlots.length) * 100)}%`
			: NOT_PROVIDED;

	const upcomingSlots = slots
		.filter(
			(slot) =>
				new Date(slot.startTime) >= now &&
				UPCOMING_STATUSES.includes(slot.status),
		)
		.sort(
			(a, b) =>
				new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
		);

	const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
	const paidLabel = student.paid ? "Fully Paid" : "Payment Pending";
	const paidTone = student.paid ? "success" : "warning";

	const slotStatusCounts = countBy(slots, (slot) => slot.status);
	const slotGraphData = Object.entries(slotStatusCounts).map(
		([label, value]) => ({ label, value }),
	);

	const answerStatusCounts = countBy(answers, (answer) => answer.status);
	const answerGraphData = Object.entries(answerStatusCounts).map(
		([label, value]) => ({ label, value }),
	);

	const lessonRows = attendedLessons.map((lesson) => ({
		name: lesson.name,
		language: lesson.language,
		description: lesson.description ?? NOT_PROVIDED,
	}));

	const upcomingRows = upcomingSlots.map((slot) => ({
		start: formatDateTime(slot.startTime),
		end: formatDateTime(slot.expectedEndTime),
		status: slot.status,
	}));

	const pastRows = pastSlots.map((slot) => ({
		start: formatDateTime(slot.startTime),
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

	const noteRows = student.notes.map((note) => ({
		text: note.text,
		writtenBy: note.writterBy,
		createdAt: formatDate(note.createdAt),
	}));

	const profileItems = [
		{ label: "Email", value: email, color: PALETTE[0] },
		{ label: "Age", value: age, color: PALETTE[1] },
		{ label: "Grade", value: grade, color: PALETTE[2] },
		{ label: "Schooling", value: schooling, color: PALETTE[3] },
		{ label: "Country", value: country, color: PALETTE[4] },
		{ label: "Languages", value: languages, color: PALETTE[5] },
		{ label: "Address", value: addressText, color: PALETTE[0] },
	];

	const kpis = [
		{
			label: "Lessons Completed",
			value: `${attendedCount}${totalProgramLessons ? ` / ${totalProgramLessons}` : ""}`,
			color: PALETTE[0],
		},
		{
			label: "Attendance",
			value: attendanceRate,
			color: PALETTE[1],
		},
		{
			label: "Upcoming Classes",
			value: String(upcomingSlots.length),
			color: PALETTE[4],
		},
		{
			label: "Balance Due",
			value: `${student.currency} ${student.remaining}`,
			color: student.remaining > 0 ? PALETTE[2] : PALETTE[1],
		},
	];

	const footer = (
		<PageFooter
			variant="minimal"
			leftText={studentName}
			rightText={<PageNumber size="xs" />}
			pagePadding={theme.spacing.page.marginLeft}
		/>
	);

	return (
		<Document title={`Student Report ${studentName}`}>
			<Page size="A4" style={styles.page}>
				<View style={styles.hero}>
					<Text style={styles.heroMeta}>STUDENT PROGRESS REPORT</Text>
					<Text style={styles.heroName} noMargin>
						{studentName}
					</Text>
					<Text style={styles.heroMeta}>
						{`${programName} · Enrolled ${formatDate(student.createdAt)} · Report ${formatDate(data.generatedAt)}`}
					</Text>
				</View>

				<View style={[styles.kpiRow, { marginTop: 14 }]}>
					{kpis.map((kpi) => (
						<View
							key={kpi.label}
							style={[
								styles.kpiCard,
								{
									borderColor: kpi.color,
									backgroundColor: theme.colors.background,
								},
							]}
						>
							<Text style={{ ...styles.kpiLabel, color: kpi.color }} noMargin>
								{kpi.label}
							</Text>
							<Text style={styles.kpiValue} noMargin>
								{kpi.value}
							</Text>
						</View>
					))}
				</View>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Program Progress
					</Text>
					<Text variant="xs" noMargin>
						{programName}
					</Text>
					{programDescription ? (
						<Text variant="xs" color="mutedForeground">
							{programDescription}
						</Text>
					) : null}
					<View style={[styles.accentBarTrack, { marginTop: 8 }]}>
						<View
							style={[
								styles.accentBar,
								{ backgroundColor: PALETTE[1], width: `${progressPercent}%` },
							]}
						/>
					</View>
					<View style={{ marginTop: 6 }}>
						<Badge
							label={`${progressPercent}% complete`}
							variant="success"
							size="sm"
						/>
						<Badge label={paidLabel} variant={paidTone} size="sm" />
					</View>
				</Section>

				<View style={[styles.twoCol, { marginTop: 4 }]}>
					<View style={styles.col}>
						<View
							style={[
								styles.personCard,
								{
									borderLeftColor: PALETTE[0],
									backgroundColor: theme.colors.background,
									borderColor: theme.colors.border,
								},
							]}
						>
							<Text style={styles.personRole} noMargin>
								Mentor
							</Text>
							<Text style={styles.personName} noMargin>
								{mentorName}
							</Text>
							{mentorEmail ? (
								<Text variant="xs" color="mutedForeground" noMargin>
									{mentorEmail}
								</Text>
							) : null}
						</View>
					</View>
					<View style={styles.col}>
						<View
							style={[
								styles.personCard,
								{
									borderLeftColor: PALETTE[5],
									backgroundColor: theme.colors.background,
									borderColor: theme.colors.border,
								},
							]}
						>
							<Text style={styles.personRole} noMargin>
								Supervisor
							</Text>
							<Text style={styles.personName} noMargin>
								{supervisorName}
							</Text>
							{supervisorEmail ? (
								<Text variant="xs" color="mutedForeground" noMargin>
									{supervisorEmail}
								</Text>
							) : null}
						</View>
					</View>
				</View>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Student Profile
					</Text>
					<View style={styles.profileGrid}>
						{profileItems.map((item) => (
							<View
								key={item.label}
								style={[
									styles.profileCard,
									{
										backgroundColor: theme.colors.background,
										borderColor: item.color,
									},
								]}
							>
								<Text
									style={{ ...styles.profileLabel, color: item.color }}
									noMargin
								>
									{item.label}
								</Text>
								<Text style={styles.profileValue} noMargin>
									{item.value}
								</Text>
							</View>
						))}
					</View>
				</Section>

				{footer}
			</Page>

			<Page size="A4" style={styles.page}>
				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Performance
					</Text>
					<View style={styles.chartRow}>
						<View style={styles.chartHalf}>
							<View style={styles.graphShell}>
								<PdfGraph
									variant="donut"
									data={answerGraphData}
									title="Quiz results"
									subtitle="Answer status across lessons"
									centerLabel={String(answers.length)}
									legend="bottom"
									colors={PALETTE}
									showValues
									fullWidth
									height={200}
									containerPadding={12}
									wrapperPadding={12}
									style={{ marginBottom: 0 }}
								/>
							</View>
						</View>
						<View style={styles.chartHalf}>
							<View style={styles.graphShell}>
								<PdfGraph
									variant="bar"
									data={slotGraphData}
									title="Class status"
									subtitle="All scheduled classes"
									colors={PALETTE}
									showValues
									showGrid
									legend="none"
									fullWidth
									height={200}
									containerPadding={12}
									wrapperPadding={12}
									style={{ marginBottom: 0 }}
								/>
							</View>
						</View>
					</View>
				</Section>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Lessons Attended
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
						Upcoming Classes
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={[
							{ header: "Starts", key: "start" },
							{ header: "Ends", key: "end" },
							{ align: "center", header: "Status", key: "status" },
						]}
						data={upcomingRows}
					/>
				</Section>

				{footer}
			</Page>

			<Page size="A4" style={styles.page}>
				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Class History
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={[
							{ header: "Started", key: "start" },
							{ header: "Ended", key: "ended" },
							{ align: "center", header: "Status", key: "status" },
						]}
						data={pastRows}
					/>
				</Section>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Payments · {student.currency} {paidTotal} paid
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
						Mentor Notes
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={[
							{ header: "Note", key: "text" },
							{ header: "By", key: "writtenBy" },
							{ header: "Date", key: "createdAt" },
						]}
						data={noteRows}
					/>
				</Section>

				{footer}
			</Page>
		</Document>
	);
};
