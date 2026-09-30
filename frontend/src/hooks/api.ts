"use client";

import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import {
	type AnyDataTag,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query";
import { sileo as toast } from "sileo";
import { orpc } from "@/lib/api";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error({
				title: `Error: ${error.message}`,
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
