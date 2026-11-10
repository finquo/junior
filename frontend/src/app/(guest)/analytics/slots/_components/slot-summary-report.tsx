import type { InferRouterOutputs } from "@orpc/server";
import type { analyticsRouter } from "backend/api";
import { PdfGraph } from "@/components/pdf/graph/graph";
import { Section } from "@/components/pdf/section/section";
import { Text } from "@/components/pdf/text/text";
import { usePdfcnTheme } from "@/components/pdf/theme-provider";
import { Document, Page, StyleSheet, View } from "@/lib/pdf-primitives";
import { Path, Svg } from "@/lib/pdf-svg";

type SlotReportData = InferRouterOutputs<typeof analyticsRouter>["slotReport"];

const NOT_PROVIDED = "Not provided";

const PALETTE = [
	"#6366F1",
	"#10B981",
	"#F59E0B",
	"#F43F5E",
	"#0EA5E9",
	"#8B5CF6",
];

const tint = (color: string) => ({
	backgroundColor: `${color}1A`,
	borderColor: color,
});

const formatDate = (value: Date | string) =>
	new Date(value).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

const formatTime = (value: Date | string) =>
	new Date(value).toLocaleTimeString("en-IN", {
		hour: "numeric",
		minute: "2-digit",
	});

export const SlotSummaryReport = ({ data }: { data: SlotReportData }) => {
	const theme = usePdfcnTheme();
	const { summary, slot, program, nextLesson, history } = data;

	const styles = StyleSheet.create({
		page: {
			backgroundColor: theme.colors.background,
			boxSizing: "border-box",
			paddingBottom: 10,
			paddingLeft: 10,
			paddingRight: 10,
			paddingTop: 10,
			position: "relative",
		},
		brand: {
			color: theme.colors.mutedForeground,
			fontSize: 7,
			letterSpacing: 1,
			textTransform: "uppercase",
		},
		rule: {
			backgroundColor: theme.colors.border,
			height: 1,
			marginBottom: 12,
			marginTop: 4,
			width: "100%",
		},
		studentName: {
			color: theme.colors.foreground,
			fontSize: 18,
			fontWeight: theme.primitives.fontWeights.bold,
		},
		subHeader: {
			marginBottom: 6,
		},
		factsRow: {
			flexDirection: "row",
			gap: 12,
			marginTop: 10,
		},
		fact: {
			flex: 1,
		},
		factLabel: {
			color: theme.colors.mutedForeground,
			fontSize: 7,
			marginBottom: 2,
			textTransform: "uppercase",
		},
		factValue: {
			color: theme.colors.foreground,
			fontSize: 10,
		},
		card: {
			borderRadius: theme.primitives.borderRadius.md,
			borderStyle: "solid",
			borderWidth: 0.5,
			padding: 10,
		},
		cardBig: {
			color: theme.colors.foreground,
			fontSize: 22,
			fontWeight: theme.primitives.fontWeights.bold,
		},
		col: {
			flex: 1,
		},
		twoCol: {
			flexDirection: "row",
			gap: 10,
		},
		listRow: {
			alignItems: "flex-start",
			flexDirection: "row",
			gap: 6,
			marginBottom: 5,
		},
		listText: {
			color: theme.colors.foreground,
			fontSize: 8,
			flex: 1,
		},
		listNumber: {
			color: theme.colors.mutedForeground,
			fontSize: 8,
			fontWeight: theme.primitives.fontWeights.bold,
		},
		checkCircle: {
			alignItems: "center",
			backgroundColor: PALETTE[1],
			borderRadius: 7,
			height: 14,
			justifyContent: "center",
			width: 14,
		},
		openCircle: {
			borderColor: PALETTE[2],
			borderRadius: 7,
			borderStyle: "solid",
			borderWidth: 1,
			height: 12,
			width: 12,
		},
		voiceRow: {
			alignItems: "center",
			flexDirection: "row",
			gap: 6,
			marginTop: 0,
		},
		voiceDot: {
			borderRadius: 4,
			height: 8,
			width: 8,
		},
		timelineRow: {
			flexDirection: "row",
			gap: 8,
			marginBottom: 1,
		},
		timelineDot: {
			backgroundColor: theme.colors.primary,
			borderRadius: 3,
			height: 6,
			marginTop: 3,
			width: 6,
		},
		wordsWrap: {
			flexDirection: "row",
			flexWrap: "wrap",
		},
	});

	const studentName = slot.student?.user?.name ?? NOT_PROVIDED;
	const teacherName = slot.teacher?.user?.name ?? NOT_PROVIDED;
	const lessonName = slot.lesson?.name ?? NOT_PROVIDED;
	const programName = program?.name ?? NOT_PROVIDED;
	const nextLessonName =
		nextLesson?.name ?? "No lessons, program has been completed";

	const startMs = new Date(slot.startTime).getTime();
	const endMs = new Date(slot.endTime ?? slot.expectedEndTime).getTime();
	const durationText = `${Math.round((endMs - startMs) / 60000)} min`;

	const voiceData = [
		{ label: "Teacher", value: summary.voiceBalance.teacherPercentage },
		{ label: "Student", value: summary.voiceBalance.studentPercentage },
	];

	const historyData = history.map((item) => ({
		label: formatDate(item.startTime),
		value: item.studentPercentage,
	}));

	return (
		<Document title={summary.title}>
			<Page size="A4" style={styles.page}>
				<Text style={styles.brand} noMargin>
					Finquo Junior
				</Text>
				<View style={styles.rule} />

				<Text style={styles.studentName} noMargin>
					{studentName}
				</Text>
				<View style={styles.factsRow}>
					<View style={styles.fact}>
						<Text style={styles.factLabel} noMargin>
							Program
						</Text>
						<Text style={styles.factValue} noMargin>
							{programName}
						</Text>
					</View>
					<View style={styles.fact}>
						<Text style={styles.factLabel} noMargin>
							Lesson
						</Text>
						<Text style={styles.factValue} noMargin>
							{lessonName}
						</Text>
					</View>
				</View>

				<View
					style={[
						styles.factsRow,
						styles.card,
						tint(PALETTE[4]),
						{ marginTop: 12 },
					]}
				>
					<View style={styles.fact}>
						<Text style={styles.factLabel} noMargin>
							Date
						</Text>
						<Text style={styles.factValue} noMargin>
							{formatDate(slot.startTime)}
						</Text>
					</View>
					<View style={styles.fact}>
						<Text style={styles.factLabel} noMargin>
							Time
						</Text>
						<Text style={styles.factValue} noMargin>
							{formatTime(slot.startTime)}
						</Text>
					</View>
					<View style={styles.fact}>
						<Text style={styles.factLabel} noMargin>
							Duration
						</Text>
						<Text style={styles.factValue} noMargin>
							{durationText}
						</Text>
					</View>
					<View style={styles.fact}>
						<Text style={styles.factLabel} noMargin>
							Teacher
						</Text>
						<Text style={styles.factValue} noMargin>
							{teacherName}
						</Text>
					</View>
				</View>

				<Section padding="none" noWrap>
					<Text variant="base" noMargin style={styles.subHeader}>
						Voice Balance
					</Text>
					<View style={styles.twoCol}>
						<View style={[styles.col, styles.card, tint(PALETTE[0])]}>
							<PdfGraph
								variant="pie"
								data={voiceData}
								legend="none"
								colors={[PALETTE[0], PALETTE[5]]}
								width={150}
								height={140}
								containerPadding={8}
								wrapperPadding={8}
								style={{ marginBottom: 0 }}
							/>
							<View style={styles.voiceRow}>
								<View
									style={[styles.voiceDot, { backgroundColor: PALETTE[0] }]}
								/>
								<Text style={styles.listText} noMargin>
									{`Teacher ${summary.voiceBalance.teacherPercentage}%`}
								</Text>
							</View>
							<View style={styles.voiceRow}>
								<View
									style={[styles.voiceDot, { backgroundColor: PALETTE[5] }]}
								/>
								<Text style={styles.listText} noMargin>
									{`Student ${summary.voiceBalance.studentPercentage}%`}
								</Text>
							</View>
						</View>
						{historyData.length > 0 ? (
							<View style={[styles.col, styles.card, tint(PALETTE[5])]}>
								<PdfGraph
									variant="line"
									data={historyData}
									showValues
									width={300}
									height={160}
									containerPadding={8}
									wrapperPadding={8}
									colors={[PALETTE[5]]}
									style={{ marginBottom: 0 }}
								/>
							</View>
						) : null}
					</View>
				</Section>

				<Section padding="none" noWrap>
					<Text variant="base" noMargin style={styles.subHeader}>
						Participation
					</Text>
					<View style={styles.twoCol}>
						<View style={[styles.col, styles.card, tint(PALETTE[2])]}>
							<Text style={styles.factLabel} noMargin>
								Questions asked by teacher
							</Text>
							<Text style={styles.cardBig} noMargin>
								{String(summary.participation.teacherQuestionCount)}
							</Text>
						</View>
						<View style={[styles.col, styles.card, tint(PALETTE[1])]}>
							<Text style={styles.factLabel} noMargin>
								Meaningful answers by student
							</Text>
							<Text style={styles.cardBig} noMargin>
								{String(summary.participation.studentMeaningfulAnswerCount)}
							</Text>
						</View>
					</View>
				</Section>

				<Section padding="none" noWrap>
					<Text variant="base" noMargin style={styles.subHeader}>
						Topic Covered
					</Text>
					<View style={[styles.card, tint(PALETTE[0])]}>
						<View style={styles.twoCol}>
							<View style={styles.col}>
								{summary.topicsCovered
									.slice(0, Math.ceil(summary.topicsCovered.length / 2))
									.map((topic, index) => (
										<View key={index as number} style={styles.timelineRow}>
											<View style={styles.timelineDot} />
											<Text style={styles.listText} noMargin>
												{topic}
											</Text>
										</View>
									))}
							</View>
							<View style={styles.col}>
								{summary.topicsCovered
									.slice(Math.ceil(summary.topicsCovered.length / 2))
									.map((topic, index) => (
										<View key={index as number} style={styles.timelineRow}>
											<View style={styles.timelineDot} />
											<Text style={styles.listText} noMargin>
												{topic}
											</Text>
										</View>
									))}
							</View>
						</View>
					</View>
				</Section>
				<Section padding="none" noWrap>
					<View style={[styles.card, tint(PALETTE[3])]}>
						<Text style={styles.factLabel} noMargin>
							Next session
						</Text>
						<Text variant="base" noMargin>
							{nextLessonName}
						</Text>
					</View>
				</Section>
			</Page>

			<Page size="A4" style={styles.page}>
				<Section padding="none" noWrap>
					<Text variant="base" noMargin style={styles.subHeader}>
						Session Highlights
					</Text>
					<View style={[styles.card, tint(PALETTE[4])]}>
						{summary.highlights.map((item, index) => (
							<View key={index as number} style={styles.listRow}>
								<Text style={styles.listNumber} noMargin>
									{`${index + 1}.`}
								</Text>
								<Text style={styles.listText} noMargin>
									{item}
								</Text>
							</View>
						))}
					</View>
				</Section>

				<Section padding="none" noWrap>
					<Text variant="base" noMargin style={styles.subHeader}>
						Words from the session
					</Text>
					<View style={[styles.card, tint(PALETTE[5])]}>
						<View style={styles.wordsWrap}>
							{summary.buzzwords.map((item, index) => (
								<Text
									key={index as number}
									noMargin
									style={{
										color: PALETTE[index % PALETTE.length],
										fontSize: ((8 + item.weight * 1.6) * 2) / 3,
										fontWeight: theme.primitives.fontWeights.bold,
										marginBottom: 4,
										marginRight: 10,
									}}
								>
									{item.word}
								</Text>
							))}
						</View>
					</View>
				</Section>

				<Section padding="none" noWrap>
					<Text variant="base" noMargin style={styles.subHeader}>
						Learning Outcomes
					</Text>
					<View style={[styles.card, tint(PALETTE[1])]}>
						{summary.learningOutcomes.map((item, index) => (
							<View key={index as number} style={styles.listRow}>
								<View style={styles.checkCircle}>
									<Svg width={8} height={8} viewBox="0 0 24 24">
										<Path
											d="M20 6 9 17l-5-5"
											stroke="#FFFFFF"
											strokeWidth={3}
											fill="none"
										/>
									</Svg>
								</View>
								<Text style={styles.listText} noMargin>
									{item}
								</Text>
							</View>
						))}
					</View>
				</Section>

				<Section padding="none" noWrap>
					<Text variant="base" noMargin style={styles.subHeader}>
						Activities
					</Text>
					<View style={styles.twoCol}>
						<View style={[styles.col, styles.card, tint(PALETTE[0])]}>
							<Text style={styles.factLabel} noMargin>
								Done in session
							</Text>
							{summary.activitiesDone.map((item, index) => (
								<View key={index as number} style={styles.listRow}>
									<Text style={styles.listNumber} noMargin>
										{`${index + 1}.`}
									</Text>
									<Text style={styles.listText} noMargin>
										{item}
									</Text>
								</View>
							))}
						</View>
						<View style={[styles.col, styles.card, tint(PALETTE[2])]}>
							<Text style={styles.factLabel} noMargin>
								Homework / to-do
							</Text>
							{summary.homework.map((item, index) => (
								<View key={index as number} style={styles.listRow}>
									<View style={styles.openCircle} />
									<Text style={styles.listText} noMargin>
										{item}
									</Text>
								</View>
							))}
						</View>
					</View>
				</Section>
			</Page>
		</Document>
	);
};
