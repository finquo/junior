import { ORPCError, type ORPCErrorCode } from "@orpc/client";
import { os } from "@orpc/server";
import { triedAsync } from "utils";
import {
	type Permissions,
	type Role,
	roles,
	type SESSION,
	type Sectors,
} from "@/auth";
import { auth } from "@/services";
import type { Context } from "./context";

export const getError = (
	code: ORPCErrorCode = "INTERNAL_SERVER_ERROR",
	message?: string,
	cause?: unknown,
) => {
	cause && console.error(cause);
	return new ORPCError(code, {
		message: message ?? "Something wrong",
		cause,
	});
};

export const handleError = (error: Error, message = "1") => {
	return getError(
		"INTERNAL_SERVER_ERROR",
		`INTERNAL_SERVER_ERROR - ${message}`,
		error,
	);
};

export const tryAPI = async <D, Def = D>(
	tag: string,
	promise: Promise<D>,
	def?: Def,
) => {
	const { error, data } = await triedAsync(promise, tag);
	if (error) throw handleError(error, tag);
	return data ?? def;
};

export const getAPI = async <D>(tag: string, promise: Promise<D>, def: D) => {
	const { error, data } = await triedAsync(promise, tag);
	if (error) throw handleError(error, tag);
	return data ?? def;
};

export const publicProcedure = os.$context<Context>();

export const protectedProcedure = publicProcedure.use(
	async ({ context, next }) => {
		const { data: session, error } = await triedAsync(
			auth.api.getSession({
				headers: context.req.headers,
			}) as Promise<SESSION | null>,
		);

		if (error)
			throw getError("INTERNAL_SERVER_ERROR", "Failed to retrieve session");

		if (!session?.user)
			throw getError(
				"UNAUTHORIZED",
				"You are not authorized to access this action",
			);

		return next({
			context: session,
		});
	},
);

const getProcedure = <R extends Role>(role: R) =>
	protectedProcedure.use(async ({ context, next }) => {
		if (context.user.role !== role)
			throw getError(
				"UNAUTHORIZED",
				"You are not authorized to access this action",
			);

		if (context.session.impersonatedBy)
			console.log(context.session.impersonatedBy);

		return next();
	});

export const adminProcedure = getProcedure("admin");
export const studentProcedure = getProcedure("student");
export const teacherProcedure = getProcedure("teacher");
export const qaAuditorProcedure = getProcedure("qa_auditor");
export const enrollmentAdvisorProcedure = getProcedure("enrollment_advisor");
export const schedulerProcedure = getProcedure("scheduler");

export const checkPermission = <AC extends Sectors>(
	checkSector: AC,
	checkAction: Permissions[AC][number],
) =>
	protectedProcedure.use(({ context, next }) => {
		if (!context.user.role)
			throw getError(
				"UNAUTHORIZED",
				"You don't have any role to access this sector",
			);

		const role = roles[context.user.role];

		if (!role?.statements)
			throw getError(
				"UNAUTHORIZED",
				"You don't have the any permission to access this sector or actions",
			);

		const statements = role.statements as unknown as Partial<
			Record<string, string[]>
		>;

		const sector = statements[checkSector];

		console.log({ sector });

		if (!sector)
			throw getError(
				"UNAUTHORIZED",
				"You don't have the permission to access this sector",
			);

		for (const action of sector) {
			if (action === checkAction) return next();
		}

		throw getError(
			"UNAUTHORIZED",
			"You don't have the permission to access this action",
		);
	});
