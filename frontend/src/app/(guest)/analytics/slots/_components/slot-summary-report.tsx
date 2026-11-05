import type { InferRouterOutputs } from "@orpc/server";
import type { analyticsRouter } from "backend/api";
import type { BadgeVariant } from "@/components/pdf/badge/badge";
import { Badge } from "@/components/pdf/badge/badge";
import { PdfGraph } from "@/components/pdf/graph/graph";
import { PdfList } from "@/components/pdf/list/list";
import { PageFooter } from "@/components/pdf/page-footer/page-footer";
import { PageNumber } from "@/components/pdf/page-number/page-number";
import { Section } from "@/components/pdf/section/section";
import { Text } from "@/components/pdf/text/text";
import { usePdfcnTheme } from "@/components/pdf/theme-provider";
import { Document, Page, StyleSheet, View } from "@/lib/pdf-primitives";

type SlotReportData = InferRouterOutputs<typeof analyticsRouter>["slotReport"];
type SlotSummary = SlotReportData["summary"];

const NOT_PROVIDED = "Not provided";

const PALETTE = [
	"#6366F1",
	"#10B981",
	"#F59E0B",
	"#F43F5E",
	"#0EA5E9",
	"#8B5CF6",
];

const understandingMeta: Record<
	SlotSummary["topicsCovered"][number]["studentUnderstanding"],
	{ label: string; variant: BadgeVariant; color: string }
> = {
	clear: { label: "Clear", variant: "success", color: PALETTE[1] },
	not_assessed: {
		label: "Not assessed",
		variant: "default",
		color: PALETTE[4],
	},
	partial: { label: "Partial", variant: "warning", color: PALETTE[2] },
	unclear: { label: "Unclear", variant: "destructive", color: PALETTE[3] },
};

const scoreVariant = (score: number): BadgeVariant => {
	if (score >= 75) {
		return "success";
	}
	if (score >= 50) {
		return "warning";
	}
	return "destructive";
};

const scoreColor = (score: number) => {
	if (score >= 75) {
		return PALETTE[1];
	}
	if (score >= 50) {
		return PALETTE[2];
	}
	return PALETTE[3];
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

export const SlotSummaryReport = ({ data }: { data: SlotReportData }) => {
	const theme = usePdfcnTheme();
	const { summary, slot } = data;

	const styles = StyleSheet.create({
		chartShell: {
			backgroundColor: theme.colors.background,
			borderColor: theme.colors.border,
			borderRadius: theme.primitives.borderRadius.md,
			borderStyle: "solid",
			borderWidth: 1,
			padding: 12,
		},
		col: {
			flex: 1,
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
		heroTitle: {
			color: theme.colors.primaryForeground,
			fontSize: 20,
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
		kpiRow: {
			flexDirection: "row",
			gap: 8,
		},
		kpiValue: {
			color: theme.colors.foreground,
			fontSize: 16,
			fontWeight: theme.primitives.fontWeights.bold,
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
		scoreBar: {
			borderRadius: 2,
			height: 6,
		},
		scoreTrack: {
			backgroundColor: theme.colors.muted,
			borderRadius: 2,
			height: 6,
			overflow: "hidden",
			width: "100%",
		},
		card: {
			backgroundColor: theme.colors.background,
			borderColor: theme.colors.border,
			borderLeftWidth: 4,
			borderRadius: theme.primitives.borderRadius.md,
			borderStyle: "solid",
			borderWidth: 1,
			padding: 10,
		},
		cardTitle: {
			color: theme.colors.foreground,
			fontSize: 11,
			fontWeight: theme.primitives.fontWeights.bold,
			marginBottom: 3,
		},
		twoCol: {
			flexDirection: "row",
			gap: 12,
		},
	});

	const studentName = slot.student?.user?.name ?? NOT_PROVIDED;
	const teacherName = slot.teacher?.user?.name ?? NOT_PROVIDED;
	const lessonName = slot.lesson?.name ?? NOT_PROVIDED;
	const teacherScore = summary.engagement.engagementScore.teacher;
	const studentScore = summary.engagement.engagementScore.student;
	const resolvedCount = summary.studentQuestionsAndDoubts.filter(
		(q) => q.wasResolved,
	).length;

	const speakingData = [
		{
			label: "Teacher",
			value: summary.interactionBreakdown.teacherSpeakingPercentage,
		},
		{
			label: "Student",
			value: summary.interactionBreakdown.studentSpeakingPercentage,
		},
		{
			label: "Silence / unknown",
			value: summary.interactionBreakdown.unknownOrSilencePercentage,
		},
	];

	const kpis = [
		{
			label: "Teacher engagement",
			value: `${teacherScore}/100`,
			color: scoreColor(teacherScore),
		},
		{
			label: "Student engagement",
			value: `${studentScore}/100`,
			color: scoreColor(studentScore),
		},
		{
			label: "Topics covered",
			value: String(summary.topicsCovered.length),
			color: PALETTE[4],
		},
		{
			label: "Doubts resolved",
			value: `${resolvedCount} / ${summary.studentQuestionsAndDoubts.length}`,
			color: PALETTE[0],
		},
	];

	const footer = (
		<PageFooter
			variant="minimal"
			leftText={summary.title}
			rightText={<PageNumber size="xs" />}
			pagePadding={theme.spacing.page.marginLeft}
		/>
	);

	return (
		<Document title={summary.title}>
			<Page size="A4" style={styles.page}>
				<View style={styles.hero}>
					<Text style={styles.heroMeta}>SESSION SUMMARY</Text>
					<Text style={styles.heroTitle} noMargin>
						{summary.title}
					</Text>
					<Text style={styles.heroMeta}>
						{`${lessonName} · ${formatDateTime(slot.startTime)}`}
					</Text>
				</View>

				<View style={[styles.twoCol, { marginTop: 12 }]}>
					<View style={styles.col}>
						<View style={[styles.card, { borderLeftColor: PALETTE[0] }]}>
							<Text style={styles.kpiLabel} noMargin>
								Teacher
							</Text>
							<Text style={styles.cardTitle} noMargin>
								{teacherName}
							</Text>
						</View>
					</View>
					<View style={styles.col}>
						<View style={[styles.card, { borderLeftColor: PALETTE[5] }]}>
							<Text style={styles.kpiLabel} noMargin>
								Student
							</Text>
							<Text style={styles.cardTitle} noMargin>
								{studentName}
							</Text>
						</View>
					</View>
				</View>

				<View style={[styles.kpiRow, { marginTop: 12 }]}>
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
						Overall Summary
					</Text>
					<Text variant="base">{summary.overallSummary}</Text>
				</Section>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Engagement
					</Text>
					<View style={styles.twoCol}>
						<View style={styles.col}>
							<View
								style={[
									styles.card,
									{ borderLeftColor: scoreColor(teacherScore) },
								]}
							>
								<Text style={styles.cardTitle} noMargin>
									Teacher
								</Text>
								<View style={styles.scoreTrack}>
									<View
										style={[
											styles.scoreBar,
											{
												backgroundColor: scoreColor(teacherScore),
												width: `${teacherScore}%`,
											},
										]}
									/>
								</View>
								<Badge
									label={`${teacherScore}/100`}
									variant={scoreVariant(teacherScore)}
									size="sm"
								/>
								<Text variant="sm" noMargin>
									{summary.engagement.teacherEngagement}
								</Text>
							</View>
						</View>
						<View style={styles.col}>
							<View
								style={[
									styles.card,
									{ borderLeftColor: scoreColor(studentScore) },
								]}
							>
								<Text style={styles.cardTitle} noMargin>
									Student
								</Text>
								<View style={styles.scoreTrack}>
									<View
										style={[
											styles.scoreBar,
											{
												backgroundColor: scoreColor(studentScore),
												width: `${studentScore}%`,
											},
										]}
									/>
								</View>
								<Badge
									label={`${studentScore}/100`}
									variant={scoreVariant(studentScore)}
									size="sm"
								/>
								<Text variant="sm" noMargin>
									{summary.engagement.studentEngagement}
								</Text>
							</View>
						</View>
					</View>
				</Section>

				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Speaking Time
					</Text>
					<View style={styles.chartShell}>
						<PdfGraph
							variant="donut"
							data={speakingData}
							centerLabel={`${summary.interactionBreakdown.studentSpeakingPercentage}%`}
							legend="right"
							colors={[PALETTE[0], PALETTE[5], PALETTE[2]]}
							showValues
							fullWidth
							height={200}
							containerPadding={12}
							wrapperPadding={12}
							style={{ marginBottom: 0 }}
						/>
					</View>
					<Text variant="xs" color="mutedForeground">
						{`Method: ${summary.interactionBreakdown.method}`}
					</Text>
				</Section>

				{footer}
			</Page>

			<Page size="A4" style={styles.page}>
				<Section padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Topics Covered
					</Text>
					{summary.topicsCovered.map((topic, index) => {
						const meta = understandingMeta[topic.studentUnderstanding];
						return (
							<View
								key={index as number}
								style={[
									styles.card,
									{ borderLeftColor: meta.color, marginBottom: 8 },
								]}
							>
								<View
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
									}}
								>
									<Text style={styles.cardTitle} noMargin>
										{topic.topic}
									</Text>
									<Badge label={meta.label} variant={meta.variant} size="sm" />
								</View>
								<Text variant="sm" noMargin>
									{topic.explanation}
								</Text>
							</View>
						);
					})}
				</Section>

				{summary.studentQuestionsAndDoubts.length > 0 ? (
					<Section padding="md" noWrap>
						<Text variant="sm" transform="uppercase" color="mutedForeground">
							Student Questions &amp; Doubts
						</Text>
						{summary.studentQuestionsAndDoubts.map((item, index) => {
							const color = item.wasResolved ? PALETTE[1] : PALETTE[3];
							return (
								<View
									key={index as number}
									style={[
										styles.card,
										{ borderLeftColor: color, marginBottom: 8 },
									]}
								>
									<View
										style={{
											flexDirection: "row",
											justifyContent: "space-between",
										}}
									>
										<Text style={styles.cardTitle} noMargin>
											{item.question}
										</Text>
										<Badge
											label={item.wasResolved ? "Resolved" : "Unresolved"}
											variant={item.wasResolved ? "success" : "destructive"}
											size="sm"
										/>
									</View>
									{item.teacherResponse ? (
										<Text variant="sm" noMargin>
											{item.teacherResponse}
										</Text>
									) : null}
								</View>
							);
						})}
					</Section>
				) : null}

				{footer}
			</Page>

			<Page size="A4" style={styles.page}>
				<View style={styles.twoCol}>
					<View style={styles.col}>
						<Section variant="card" padding="md" noWrap>
							<Text variant="sm" transform="uppercase" color="mutedForeground">
								Key Takeaways
							</Text>
							<PdfList
								variant="checklist"
								gap="sm"
								items={summary.keyTakeaways.map((item) => ({
									checked: true,
									text: item,
								}))}
							/>
						</Section>
					</View>
					<View style={styles.col}>
						<Section variant="card" padding="md" noWrap>
							<Text variant="sm" transform="uppercase" color="mutedForeground">
								Suggested Next Steps
							</Text>
							<PdfList
								variant="numbered"
								gap="sm"
								items={summary.suggestedNextSteps.map((item) => ({
									text: item,
								}))}
							/>
						</Section>
					</View>
				</View>

				{footer}
			</Page>
		</Document>
	);
};
