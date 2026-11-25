"use client";

import {
	type DefaultError,
	type QueryKey,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import type * as React from "react";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type LoadQueryProps<
	TQueryFnData = unknown,
	TData = unknown,
	TError = DefaultError,
	TQueryKey extends QueryKey = readonly unknown[],
> = {
	label: string;
	api: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>;
	children: (data: NonNullable<TData>) => React.ReactElement;
	wrapper?: (children: React.ReactElement) => React.ReactElement;
};

function LoadQueryInner<
	TQueryFnData = unknown,
	TData = unknown,
	TError = DefaultError,
	TQueryKey extends QueryKey = readonly unknown[],
>({
	label,
	api,
	children,
}: LoadQueryProps<TQueryFnData, TData, TError, TQueryKey>) {
	const { isPending, isError, data } = useQuery(api);

	if (isPending) return <Loader />;

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Error fetch "{label}"</AlertTitle>
				<AlertDescription>
					The requested {label} could not be loaded.
				</AlertDescription>
			</Alert>
		);
	}

	if (!data) {
		return (
			<Alert variant="warning">
				<AlertTitle>{label} Not Found</AlertTitle>
				<AlertDescription>
					The requested {label} does not exist.
				</AlertDescription>
			</Alert>
		);
	}

	return children(data as NonNullable<TData>);
}

export function LoadQuery<
	TQueryFnData = unknown,
	TData = unknown,
	TError = DefaultError,
	TQueryKey extends QueryKey = readonly unknown[],
>(props: LoadQueryProps<TQueryFnData, TData, TError, TQueryKey>) {
	const { label, api, wrapper = (c) => c } = props;

	if (!api) {
		return wrapper(
			<Alert variant="destructive">
				<AlertTitle>Invalid {label}</AlertTitle>
				<AlertDescription>
					No valid {label} identifier was found.
				</AlertDescription>
			</Alert>,
		);
	}

	return wrapper(<LoadQueryInner {...props} wrapper={wrapper} />);
}
