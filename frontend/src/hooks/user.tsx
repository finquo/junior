import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { Role, USER } from "@/lib/auth";
import { api } from "./api";
import { useAuth } from "./auth";

export const FetchUser = (props: {
	id?: string | null;
	isPending?: ReactNode;
	isError?: ReactNode;
	notFound?: ReactNode;
	children: (user: USER) => ReactNode;
}) => {
	if (!props.id) return;

	const { data, isPending, isError } = useQuery(
		api.common.getUser.queryOptions({
			input: { id: props.id },
		}),
	);

	if (isError && props.isError) return props.isError;

	if (isPending && props.isPending) return props.isPending;

	if (!data) {
		if (props.notFound) return props.notFound;
		return;
	}

	return props.children(data);
};

export const CheckSameUser = ({
	email,
	children,
	fallback,
}: {
	email: string;
	children: ReactNode;
	fallback?: ReactNode;
}) => {
	const { data } = useAuth();
	const sameUser = data?.email === email;

	if (sameUser) return <>{fallback}</>;

	return <>{children}</>;
};

export const GetUserData = ({ id, role }: {
	id: string;
	role: Role
}) => {
	const res = useQuery(
		api.common.getUser.queryOptions({
			input: { id },
		}),
	);

	if (res.data) return { ...res, data: res.data[`${role}Data` as ] }

	return res;
};
