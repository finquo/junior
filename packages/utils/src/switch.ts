export const SwitchFunc = <T extends string | number, R>(
	cases: T,
	{
		defaultOption,
		...options
	}: {
		defaultOption?: R;
	} & {
		[K in T]: R;
	},
): R => {
	return (options[cases as keyof typeof options] ?? defaultOption) as R;
};
