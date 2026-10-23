import z from "zod";

export const Currencies = {
	INR: "Rupees",
	USD: "Dollar",
};

export type CurrencyCodes = keyof typeof Currencies;

/** Display symbols keyed by ISO 4217 currency code. */
export const CurrencySymbols: Record<CurrencyCodes, string> = {
	INR: "₹",
	USD: "$",
};

export const CurrencyZod = z.enum(Object.keys(Currencies));

/** Human-readable currency name for an ISO 4217 code. */
export const getCurrencyName = (code: string) =>
	(Currencies as Record<string, string | undefined>)[code] ?? code;

/** Display symbol for an ISO 4217 code. */
export const getCurrencySymbol = (code: string) =>
	(CurrencySymbols as Record<string, string | undefined>)[code] ?? code;
