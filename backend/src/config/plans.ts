export type Country = "IN" | "US";
export type Language = "ml-IN" | "en-IN";
export type Currency = "₹" | "$";

export type Plan = {
	id: string;
	name: string;
	description: string;
	count: number;
	price: Record<Country, number>;
};

export const plans = [
	{
		id: "finquo-30",
		name: "Finquo 30",
		description: "Finquo 30",
		count: 30,
		price: {
			IN: 1000,
			US: 10,
		},
	} as const,
	{
		id: "finquo-60",
		name: "Finquo 60",
		description: "Finquo 60",
		count: 60,
		price: {
			IN: 2000,
			US: 20,
		},
	} as const,
] satisfies Plan[];

export const planKeys = plans.map((p) => p.id);

export type PlayKeys = (typeof planKeys)[number];
