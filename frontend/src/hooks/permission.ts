"use client";

import { type Permissions, roles } from "backend/auth";
import { useAuth } from "./auth";

export const usePermission = <AC extends keyof Partial<Permissions>>(
	checkSector: AC,
	checkAction: Permissions[AC][number],
) => {
	const { data } = useAuth();

	if (!data?.role) return { render: false, role: null };

	const role = roles[data.role];
	const statements = role.statements as unknown as Record<
		string,
		undefined | string[]
	>;
	const sector = statements[checkSector as string];

	if (!sector) return { render: false, role: data.role };

	for (const action of sector) {
		if (action === checkAction) return { render: true, role: data.role };
	}

	return { render: false, role: data.role };
};

export const PermissionRender = <AC extends keyof Partial<Permissions>>(props: {
	checkSector: AC;
	checkAction: Permissions[AC][number];
	fallback?: React.ReactNode;
	children: React.ReactNode;
}) => {
	const { render } = usePermission(props.checkSector, props.checkAction);

	if (!render) return props.fallback;

	return props.children;
};
