import { and, desc, eq } from "drizzle-orm";
import { CurrencyZod } from "utils";
import z from "zod";
import { getAPI, getError, getRolesProcedure, tryAPI } from "@/api/procedure";
import { schema } from "@/db";
import { Increment } from "@/db/utils";
import { InsertPaymentSchema, SelectPaymentSchema } from "@/db/zod";
import { db } from "@/services";
import { MapRole } from "@/utils/role";

export const paymentRouter = {
	list: getRolesProcedure(["admin", "scheduler"])
		.input(
			z.object({
				studentId: z.string().optional(),
			}),
		)
		.handler(async ({ input, context }) => {
			return await getAPI(
				"db-core-list-payments-query",
				db
					.select()
					.from(schema.payment)
					.innerJoin(
						schema.student,
						eq(schema.payment.studentId, schema.student.id),
					)
					.where(
						and(
							input.studentId
								? eq(schema.payment.studentId, input.studentId)
								: undefined,
							MapRole(context.role, {
								admin: undefined,
								scheduler: eq(schema.student.supervisorId, context.user.id),
							}),
						),
					)
					.orderBy(desc(schema.payment.createdAt))
					.then((rows) => rows.map((row) => row.payment)),
				[],
			);
		}),
	get: getRolesProcedure(["admin", "scheduler"])
		.input(
			SelectPaymentSchema.pick({
				id: true,
			}),
		)
		.handler(async ({ input, context }) => {
			const rows = await tryAPI(
				"db-core-get-payment-query",
				db
					.select()
					.from(schema.payment)
					.innerJoin(
						schema.student,
						eq(schema.payment.studentId, schema.student.id),
					)
					.where(
						and(
							eq(schema.payment.id, input.id),
							MapRole(context.role, {
								admin: undefined,
								scheduler: eq(schema.student.supervisorId, context.user.id),
							}),
						),
					)
					.limit(1),
			);

			return rows?.[0]?.payment ?? null;
		}),
	create: getRolesProcedure(["admin"])
		.input(
			InsertPaymentSchema.pick({
				amount: true,
				paidAt: true,
				transactionId: true,
			}).extend({
				studentId: z.string(),
				currency: CurrencyZod.optional(),
			}),
		)
		.handler(async ({ input }) => {
			const student = await tryAPI(
				"db-core-create-payment-get-student",
				db.query.student.findFirst({
					where: { id: input.studentId },
					columns: {
						id: true,
						program: true,
						currency: true,
						remaining: true,
					},
				}),
			);

			if (!student) throw getError("NOT_FOUND", "Student not found");

			const program = student.program;

			if (!program)
				throw getError(
					"NOT_FOUND",
					"Assign a program to the student before recording payments",
				);

			if (input.amount > student.remaining)
				throw getError(
					"INPUT_VALIDATION_FAILED",
					"Payment amount cannot exceed the remaining amount",
				);

			const remaining = student.remaining - input.amount;

			const currency = input.currency ?? student.currency ?? "INR";

			return await tryAPI(
				"db-core-create-payment-query",
				db.transaction(async (tx) => {
					const payments = await tx
						.insert(schema.payment)
						.values({
							studentId: student.id,
							program,
							amount: input.amount,
							paidAt: input.paidAt ?? new Date(),
							currency,
							transactionId: input.transactionId ?? null,
						})
						.returning();

					const students = await tx
						.update(schema.student)
						.set({
							remaining,
							paid: remaining <= 0,
						})
						.where(eq(schema.student.id, student.id))
						.returning({
							remaining: schema.student.remaining,
							paid: schema.student.paid,
						});

					return {
						payment: payments[0],
						student: students[0],
					};
				}),
			);
		}),
	update: getRolesProcedure(["admin"])
		.input(
			SelectPaymentSchema.pick({
				amount: true,
				paidAt: true,
			})
				.partial()
				.extend({
					id: z.string(),
					amount: z.number().int().gt(0).optional(),
					transactionId: z.string().optional(),
				}),
		)
		.handler(async ({ input }) => {
			const payment = await tryAPI(
				"db-core-update-payment-get-payment",
				db.query.payment.findFirst({
					where: { id: input.id },
				}),
			);

			if (!payment) throw getError("NOT_FOUND", "Payment not found");

			if (
				input.amount === undefined &&
				input.paidAt === undefined &&
				input.transactionId === undefined
			)
				return { payment, remaining: null, paid: null };

			const newAmount = input.amount ?? payment.amount;

			if (newAmount !== payment.amount) {
				const student = await tryAPI(
					"db-core-update-payment-get-student",
					db.query.student.findFirst({
						where: { id: payment.studentId },
						columns: {
							id: true,
							remaining: true,
						},
					}),
				);

				if (!student) throw getError("NOT_FOUND", "Student not found");

				const remaining = student.remaining - (newAmount - payment.amount);
				const paid = remaining <= 0;

				return await tryAPI(
					"db-core-update-payment-query",
					db.transaction(async (tx) => {
						const payments = await tx
							.update(schema.payment)
							.set({
								amount: newAmount,
								paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
								transactionId: input.transactionId ?? undefined,
							})
							.where(eq(schema.payment.id, payment.id))
							.returning();

						const students = await tx
							.update(schema.student)
							.set({
								remaining,
								paid,
							})
							.where(eq(schema.student.id, student.id))
							.returning({
								remaining: schema.student.remaining,
								paid: schema.student.paid,
							});

						return {
							payment: payments[0],
							student: students[0],
						};
					}),
				);
			}

			return await tryAPI(
				"db-core-update-payment-query",
				db
					.update(schema.payment)
					.set({
						paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
						transactionId: input.transactionId ?? undefined,
					})
					.where(eq(schema.payment.id, payment.id))
					.returning()
					.then((payments) => ({
						payment: payments[0],
						student: null,
					})),
			);
		}),
	remove: getRolesProcedure(["admin"])
		.input(
			SelectPaymentSchema.pick({
				id: true,
			}),
		)
		.handler(async ({ input }) => {
			const payment = await tryAPI(
				"db-core-remove-payment-get-payment",
				db.query.payment.findFirst({
					where: { id: input.id },
				}),
			);

			if (!payment) throw getError("NOT_FOUND", "Payment not found");

			return await tryAPI(
				"db-core-remove-payment-query",
				db.transaction(async (tx) => {
					const payments = await tx
						.delete(schema.payment)
						.where(eq(schema.payment.id, payment.id))
						.returning();

					const students = await tx
						.update(schema.student)
						.set({
							remaining: Increment(schema.student.remaining, payment.amount),
							paid: false,
						})
						.where(eq(schema.student.id, payment.studentId))
						.returning({
							remaining: schema.student.remaining,
							paid: schema.student.paid,
						});

					return {
						payment: payments[0],
						student: students[0],
					};
				}),
			);
		}),
};
