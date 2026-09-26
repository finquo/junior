import { useState } from "react";

export const useFeedback = <T extends (...props: any[]) => unknown>(
	setState: T,
	fakeTime = 1000,
) => {
	const [isPending, setPending] = useState(false);

	const mutate = (...props: Parameters<T>) => {
		setPending(true);
		setState(...props);
		setTimeout(() => {
			setPending(false);
		}, fakeTime);
	};

	return {
		mutate,
		isPending,
	};
};
