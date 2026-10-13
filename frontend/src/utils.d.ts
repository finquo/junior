type TriggerType = { children: React.ReactElement };

type NullifyOptional<T> = {
	[K in keyof T]: undefined extends T[K] ? T[K] | null : T[K];
};

type NullifyOptionalStrict<T> = {
	[K in keyof T as undefined extends T[K] ? K : never]?: Exclude<
		T[K],
		undefined
	> | null;
} & {
	[K in keyof T as undefined extends T[K] ? never : K]: T[K];
};
