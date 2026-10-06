import { type Permissions, roles, type Sectors } from "@/auth";
import { getError, protectedProcedure } from "./procedure";

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
