import { os } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";
import z from "zod";
import { meetingSummarySchema } from "@/ai/summarize";
import { mediaStorage } from "@/aws/media";
import { schema } from "@/db";
import { db } from "@/services";
import { getAPI, getError, tryAPI } from "../procedure";

const publicNextProcedure = os.$context();

export const analyticsRouter = {
	studentReport: publicNextProcedure
		.input(z.object({ id: z.string() }))
		.handler(async ({ input }) => {
			const student = await tryAPI(
				"db-analytics-student-report-student",
				db.query.student.findFirst({
					where: { id: input.id },
					with: {
						user: { columns: { name: true, email: true, image: true } },
						mentor: {
							with: { user: { columns: { name: true, email: true } } },
						},
						scheduler: {
							with: { user: { columns: { name: true, email: true } } },
						},
						programInfo: {
							columns: {
								name: true,
								description: true,
								price: true,
								lessons: true,
							},
						},
					},
				}),
			);

			if (!student) throw getError("NOT_FOUND", "Student not found");

			const attendedIds = student.attendedLessons ?? [];

			const [attendedLessons, slots, payments, materials, answers] =
				await Promise.all([
					attendedIds.length === 0
						? []
						: getAPI(
								"db-analytics-student-report-attended-lessons",
								db
									.select()
									.from(schema.lesson)
									.where(inArray(schema.lesson.id, attendedIds)),
								[],
							),
					getAPI(
						"db-analytics-student-report-slots",
						db
							.select()
							.from(schema.slot)
							.where(eq(schema.slot.studentId, input.id)),
						[],
					),
					getAPI(
						"db-analytics-student-report-payments",
						db
							.select()
							.from(schema.payment)
							.where(eq(schema.payment.studentId, input.id)),
						[],
					),
					getAPI(
						"db-analytics-student-report-materials",
						db
							.select()
							.from(schema.material)
							.where(eq(schema.material.studentId, input.id)),
						[],
					),
					getAPI(
						"db-analytics-student-report-answers",
						db
							.select()
							.from(schema.answer)
							.where(eq(schema.answer.studentId, input.id)),
						[],
					),
				]);

			return {
				generatedAt: new Date().toISOString(),
				student,
				attendedLessons,
				slots,
				payments,
				materials,
				answers,
			};
		}),
	slotReport: publicNextProcedure
		.input(z.object({ id: z.string().min(1) }))
		.handler(async ({ input }) => {
			const slot = await tryAPI(
				"db-analytics-slot-report-slot",
				db.query.slot.findFirst({
					where: { id: input.id },
					with: {
						lesson: { columns: { name: true, language: true } },
						student: {
							with: { user: { columns: { name: true } } },
						},
						teacher: {
							with: { user: { columns: { name: true } } },
						},
					},
				}),
			);

			if (!slot) throw getError("NOT_FOUND", "Session not found");

			const raw = await tryAPI(
				"aws-s3-get-slot-summary",
				mediaStorage.getItem(`${input.id}/summary/main.json`),
			);

			if (!raw) throw getError("NOT_FOUND", "Summary not generated yet");

			const summary = meetingSummarySchema.parse(raw);

			return {
				generatedAt: new Date().toISOString(),
				slot,
				summary,
			};
		}),
	demo: publicNextProcedure.handler(
		() =>
			({
				author: "Growth Team",
				generatedAt: "February 23, 2026",
				highlights: [
					"Channel mix improved CAC while maintaining lead quality.",
					"Lifecycle email workflow has deliverability issues under investigation.",
					"Referral program is producing higher-intent pipeline with lower cost.",
				],
				period: "Campaign Cycle 2026-02",
				rows: [
					{
						label: "SEO",
						owner: "H. Evans",
						progress: 84,
						risk: "Low",
						status: "On Track",
					},
					{
						label: "Paid Search",
						owner: "K. Martin",
						progress: 80,
						risk: "Low",
						status: "On Track",
					},
					{
						label: "Lifecycle Email",
						owner: "V. Lee",
						progress: 64,
						risk: "Medium",
						status: "At Risk",
					},
					{
						label: "Partner Referrals",
						owner: "J. Gomez",
						progress: 75,
						risk: "Medium",
						status: "On Track",
					},
				],
				series: [
					{ label: "W1", value: 55 },
					{ label: "W2", value: 57 },
					{ label: "W3", value: 59 },
					{ label: "W4", value: 60 },
					{ label: "W5", value: 62 },
					{ label: "W6", value: 63 },
					{ label: "W7", value: 65 },
					{ label: "W8", value: 67 },
					{ label: "W9", value: 66 },
					{ label: "W10", value: 68 },
					{ label: "W11", value: 70 },
					{ label: "W12", value: 72 },
				],
				subtitle: "Pipeline, conversion efficiency, and channel performance",
				summary: [
					{
						label: "MQLs",
						tone: "success",
						trend: "+22.1% cycle",
						value: "3,940",
					},
					{ label: "CAC", tone: "success", trend: "-7.4%", value: "$118" },
					{
						label: "Win Rate",
						tone: "info",
						trend: "+1.1 pts",
						value: "28.6%",
					},
					{
						label: "Churn Risk",
						tone: "warning",
						trend: "+0.8 pts",
						value: "6.2%",
					},
				],
				title: "Growth & Marketing Report",
			}) as const,
	),
};
