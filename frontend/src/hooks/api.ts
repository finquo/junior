"use client";

import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import {
	type AnyDataTag,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { orpc } from "@/lib/api";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error(`Error: ${error.message}`, {
				action: {
					label: "retry",
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
