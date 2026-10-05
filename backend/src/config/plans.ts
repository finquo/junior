import z from "zod";

export const Countries = {
	IN: "India",
	US: "United States of America",
};
export type CountryCodes = keyof typeof Countries;

export const Languages = {
	"ml-IN": "Malayalam (India)",
	"en-IN": "English (India)",
};
export const LanguageCodeKey = Object.keys(Languages)
export type LanguageCodes = keyof typeof Languages;

export const LanguageCodeZod = z.enum(LanguageCodeKey);

export const Currencies = {
	"₹": "Rupees",
	$: "Dollar",
};
export type CurrencyCodes = keyof typeof Currencies;

export type Plan = {
	id: string;
	name: string;
	description: string;
	count: number;
	price: Record<CountryCodes, number>;
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
