import type { BadgeVariant } from "@/components/pdf/badge/badge";
import { Badge } from "@/components/pdf/badge/badge";
import { DataTable } from "@/components/pdf/data-table/data-table";
import type { DataTableColumn } from "@/components/pdf/data-table/data-table.types";
import { KeyValue } from "@/components/pdf/key-value/key-value";
import { PdfList } from "@/components/pdf/list/list";
import { PageFooter } from "@/components/pdf/page-footer/page-footer";
import { PageHeader } from "@/components/pdf/page-header/page-header";
import { PageNumber } from "@/components/pdf/page-number/page-number";
import { Section } from "@/components/pdf/section/section";
import { Text } from "@/components/pdf/text/text";
import {
	PdfcnThemeProvider,
	usePdfcnTheme,
	useSafeMemo,
} from "@/components/pdf/theme-provider";
import { Document, Page, StyleSheet, View } from "@/lib/pdf-primitives";
import type { PdfcnTheme } from "@/types/pdf-themes";

import type {
	SlotSummary,
	SlotSummaryQuestion,
	SlotSummaryTopic,
	StudentUnderstanding,
} from "./types";

const understandingMeta: Record<
	StudentUnderstanding,
	{ label: string; variant: BadgeVariant }
> = {
	clear: { label: "Clear", variant: "success" },
	not_assessed: { label: "Not assessed", variant: "default" },
	partial: { label: "Partial", variant: "warning" },
	unclear: { label: "Unclear", variant: "destructive" },
};

const scoreTone = (score: number): BadgeVariant => {
	if (score >= 75) {
		return "success";
	}
	if (score >= 50) {
		return "warning";
	}
	return "destructive";
};

const createStyles = (t: PdfcnTheme) =>
	StyleSheet.create({
		column: {
			flex: 1,
		},
		columns: {
			alignItems: "flex-start",
			flexDirection: "row",
			gap: t.spacing.componentGap,
		},
		page: {
			backgroundColor: t.colors.background,
			boxSizing: "border-box",
			minHeight: 841,
			paddingBottom: t.spacing.page.marginBottom,
			paddingLeft: t.spacing.page.marginLeft,
			paddingRight: t.spacing.page.marginRight,
			paddingTop: t.spacing.page.marginTop,
		},
	});

const EngagementCard = ({
	description,
	label,
	score,
}: {
	description: string;
	label: string;
	score: number;
}) => (
	<Section variant="card" padding="md" noWrap style={{ flex: 1 }}>
		<Text variant="xs" transform="uppercase" color="mutedForeground">
			{label}
		</Text>
		<Badge label={`${score}/100`} variant={scoreTone(score)} size="sm" />
		<Text variant="sm" noMargin>
			{description}
		</Text>
	</Section>
);

const topicColumns = [
	{ header: "Topic", key: "topic", width: "28%" },
	{
		header: "Understanding",
		key: "studentUnderstanding",
		width: "18%",
		render: (value: unknown) => {
			const meta =
				understandingMeta[value as StudentUnderstanding] ??
				understandingMeta.not_assessed;
			return <Badge label={meta.label} variant={meta.variant} size="sm" />;
		},
	},
	{ header: "Explanation", key: "explanation" },
] satisfies DataTableColumn<SlotSummaryTopic>[];

const questionColumns = [
	{ header: "Question", key: "question", width: "42%" },
	{
		header: "Status",
		key: "wasResolved",
		width: "16%",
		render: (value: unknown) => (
			<Badge
				label={value ? "Resolved" : "Unresolved"}
				variant={value ? "success" : "destructive"}
				size="sm"
			/>
		),
	},
	{ header: "Teacher response", key: "teacherResponse" },
] satisfies DataTableColumn<SlotSummaryQuestion>[];

const SlotSummaryLayout = ({
	generatedAt,
	slotId,
	summary,
}: {
	generatedAt: string;
	slotId: string;
	summary: SlotSummary;
}) => {
	const theme = usePdfcnTheme();
	const styles = useSafeMemo(() => createStyles(theme), [theme]);

	return (
		<Document title={summary.title}>
			<Page size="A4" style={styles.page}>
				<PageHeader
					variant="two-column"
					title={summary.title}
					subtitle="AI-generated session summary"
					rightText={`Slot ${slotId}`}
					rightSubText={`Generated ${generatedAt}`}
					marginBottom={14}
				/>

				<Section padding="md" noWrap>
					<Text
						variant="sm"
						transform="uppercase"
						color="mutedForeground"
						noMargin
					>
						Overall summary
					</Text>
					<Text variant="base">{summary.overallSummary}</Text>
				</Section>

				<Section padding="none" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Engagement
					</Text>
					<View style={styles.columns}>
						<View style={styles.column}>
							<EngagementCard
								label="Teacher engagement"
								score={summary.engagement.engagementScore.teacher}
								description={summary.engagement.teacherEngagement}
							/>
						</View>
						<View style={styles.column}>
							<EngagementCard
								label="Student engagement"
								score={summary.engagement.engagementScore.student}
								description={summary.engagement.studentEngagement}
							/>
						</View>
					</View>
				</Section>

				<Section variant="card" padding="md" noWrap>
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Interaction breakdown
					</Text>
					<KeyValue
						size="sm"
						divided
						items={[
							{
								key: "Teacher speaking",
								value: `${summary.interactionBreakdown.teacherSpeakingPercentage}%`,
							},
							{
								key: "Student speaking",
								value: `${summary.interactionBreakdown.studentSpeakingPercentage}%`,
							},
							{
								key: "Silence / unknown",
								value: `${summary.interactionBreakdown.unknownOrSilencePercentage}%`,
							},
							{
								key: "Method",
								value: summary.interactionBreakdown.method,
							},
						]}
					/>
				</Section>

				<Section padding="md">
					<Text variant="sm" transform="uppercase" color="mutedForeground">
						Topics covered
					</Text>
					<DataTable
						variant="compact"
						size="compact"
						stripe
						columns={topicColumns}
						data={summary.topicsCovered}
					/>
				</Section>

				{summary.studentQuestionsAndDoubts.length > 0 ? (
					<Section padding="md">
						<Text variant="sm" transform="uppercase" color="mutedForeground">
							Student questions &amp; doubts
						</Text>
						<DataTable
							variant="compact"
							size="compact"
							stripe
							columns={questionColumns}
							data={summary.studentQuestionsAndDoubts}
						/>
					</Section>
				) : null}

				<Section padding="none" noWrap>
					<View style={styles.columns}>
						<View style={styles.column}>
							<Section variant="card" padding="md" noWrap>
								<Text
									variant="sm"
									transform="uppercase"
									color="mutedForeground"
								>
									Key takeaways
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
						<View style={styles.column}>
							<Section variant="card" padding="md" noWrap>
								<Text
									variant="sm"
									transform="uppercase"
									color="mutedForeground"
								>
									Suggested next steps
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
				</Section>

				<PageFooter
					variant="three-column"
					leftText="Confidential - Internal Use"
					centerText="Generated with pdfcn"
					rightText={<PageNumber size="xs" />}
					sticky
					pagePadding={theme.spacing.page.marginLeft}
				/>
			</Page>
		</Document>
	);
};

export const SlotSummaryPdf = ({
	generatedAt,
	slotId,
	summary,
}: {
	generatedAt: string;
	slotId: string;
	summary: SlotSummary;
}) => (
	<PdfcnThemeProvider>
		<SlotSummaryLayout
			generatedAt={generatedAt}
			slotId={slotId}
			summary={summary}
		/>
	</PdfcnThemeProvider>
);
