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
export const LanguageCodeKey = ["ml-IN", "en-IN"] as const;
export type LanguageCodes = keyof typeof Languages;

export const LanguageCodeZod = z.enum(LanguageCodeKey);

export const Currencies = {
	"₹": "Rupees",
	$: "Dollar",
};
export type CurrencyCodes = keyof typeof Currencies;
