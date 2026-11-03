export const trys = <T>(func: () => T) => {
	try {
		const data = func() as T;
		return { error: null, data, isSuccess: true };
	} catch (e) {
		return { error: e as Error, data: null, isSuccess: false };
	}
};

export const triedAsync = <T, U = Error>(
	promise: Promise<T>,
	tag?: string,
): Promise<
	| {
			data: undefined;
			error: U;
			isSuccess: false;
	  }
	| {
			data: T;
			error: undefined;
			isSuccess: true;
	  }
> =>
	promise
		.then((data: T) => ({
			data,
			error: undefined,
			isSuccess: true as true,
		}))
		.catch((err: U) => {
			tag && console.error("Error", tag, ":", err);

			return {
				error: err,
				data: undefined,
				isSuccess: false,
			};
		});

export const tryAsync = async <D, E = Error>(
	promise: Promise<D>,
	tag?: string,
): Promise<[E, undefined] | [undefined, D]> => {
	const { data, error } = await triedAsync(promise, tag);

	return [error, data] as [E, undefined] | [undefined, D];
};

export const tryAPI = async <D, Def = D>(
	tag: string,
	promise: Promise<D>,
	def?: Def,
) => {
	const { error, data } = await triedAsync(promise, tag);
	if (error) console.error(tag, error);
	return data ?? def;
};

export const tryFunc = async <D, Def = D>(
	tag: string,
	func: () => Promise<D>,
	def?: Def,
) => {
	const { error, data } = await triedAsync(func(), tag);
	if (error) console.error(tag, error);
	return data ?? def;
};
