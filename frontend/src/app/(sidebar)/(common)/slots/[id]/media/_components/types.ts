export type StudentUnderstanding =
	| "clear"
	| "partial"
	| "unclear"
	| "not_assessed";

export type SlotSummaryTopic = {
	topic: string;
	explanation: string;
	studentUnderstanding: StudentUnderstanding;
};

export type SlotSummaryQuestion = {
	question: string;
	wasResolved: boolean;
	teacherResponse: string | null;
};

export type SlotSummary = {
	title: string;
	overallSummary: string;
	engagement: {
		teacherEngagement: string;
		studentEngagement: string;
		engagementScore: {
			teacher: number;
			student: number;
		};
	};
	topicsCovered: SlotSummaryTopic[];
	studentQuestionsAndDoubts: SlotSummaryQuestion[];
	interactionBreakdown: {
		teacherSpeakingPercentage: number;
		studentSpeakingPercentage: number;
		unknownOrSilencePercentage: number;
		method: string;
	};
	keyTakeaways: string[];
	suggestedNextSteps: string[];
};
