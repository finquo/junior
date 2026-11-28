"use client";

import {
	type DefaultError,
	type QueryKey,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { CircleAlertIcon, SearchXIcon } from "lucide-react";
import type * as React from "react";
import Loader from "@/components/loader";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

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
	pending?: React.ReactElement;
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
	pending = <Loader />,
}: LoadQueryProps<TQueryFnData, TData, TError, TQueryKey>) {
	const { isPending, isError, data } = useQuery(api);

	if (isPending) return pending;

	if (isError) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
						<CircleAlertIcon />
					</EmptyMedia>
					<EmptyTitle>Error fetch "{label}"</EmptyTitle>
					<EmptyDescription>
						The requested {label} could not be loaded.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	if (!data) {
		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<SearchXIcon />
					</EmptyMedia>
					<EmptyTitle>{label} Not Found</EmptyTitle>
					<EmptyDescription>
						The requested {label} does not exist.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
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
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
						<CircleAlertIcon />
					</EmptyMedia>
					<EmptyTitle>Invalid {label}</EmptyTitle>
					<EmptyDescription>
						No valid {label} identifier was found.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>,
		);
	}

	return wrapper(<LoadQueryInner {...props} wrapper={wrapper} />);
}
