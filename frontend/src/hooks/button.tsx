import {
	type DefaultError,
	type MutationStatus,
	type UseMutationOptions,
	type UseMutationResult,
	useMutation,
} from "@tanstack/react-query";

export const MutationButton = <
	TData = unknown,
	TError = DefaultError,
	TVariables = void,
	TOnMutateResult = unknown,
>({
	api,
	children,
	wrapper = (children) => <>{children}</>,
	success,
	onSuccess,
	...props
}: {
	api: UseMutationOptions<TData, TError, TVariables, TOnMutateResult>;
	wrapper?: (
		children: React.ReactNode,
		mutate: UseMutationResult<
			TData,
			TError,
			TVariables,
			TOnMutateResult
		>["mutate"],
		state: MutationStatus,
	) => React.ReactNode;
	isSuccess?: React.ReactNode;
	isPending?: React.ReactNode;
	isError?: React.ReactNode;
	children?: React.ReactNode;
	mutate?: (
		mutate: UseMutationResult<
			TData,
			TError,
			TVariables,
			TOnMutateResult
		>["mutate"],
	) => React.ReactNode;
	success?: boolean;
	reTry?: (
		mutate: UseMutationResult<
			TData,
			TError,
			TVariables,
			TOnMutateResult
		>["mutate"],
	) => React.ReactNode;
	onSuccess?: (data: TData) => Promise<void> | void;
}) => {
	const { isError, isPending, isSuccess, mutate, status } = useMutation({
		onSuccess,
		...api,
	});

	if ((success || isSuccess) && props.isSuccess)
		return wrapper(props.isSuccess, mutate, status);

	if (isPending && props.isPending)
		return wrapper(props.isPending, mutate, status);

	if (isError && props.reTry)
		return wrapper(props.reTry(mutate), mutate, status);

	if (isError && props.isError) return wrapper(props.isError, mutate, status);

	if (props.mutate) return wrapper(props.mutate(mutate), mutate, status);

	return wrapper(children, mutate, status);
};
