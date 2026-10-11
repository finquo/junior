"use client";

import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import {
	type AnyDataTag,
	MutationCache,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query";
import { sileo as toast } from "sileo";
import { orpc } from "@/lib/api";

export const queryClient = new QueryClient({
	mutationCache: new MutationCache({
		onError: (error, param, result, mutation) => {
			toast.error({
				title: error.name,
				description: error.message,
				button: {
					title: "retry",
					onClick: () => {
						mutation.execute(param);
					},
				},
			});
		},
	}),
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error({
				title: error.name,
				description: error.message,
				button: {
					title: "retry",
					onClick: () => {
						query.invalidate();
					},
				},
			});
		},
	}),
});

export const refetchAPIs = (refetchKeys: AnyDataTag[]) => {
	refetchKeys.forEach((rk) => {
		queryClient.refetchQueries({
			queryKey: rk as unknown as unknown[],
			exact: true,
		});
	});
};

export const api = createTanstackQueryUtils(orpc);
