import z from "zod";
import { type CurrencyCodes, getCurrencySymbol } from "./currency";

/** ISO 3166-1 Alpha-2 */
export const Countries = {
	IN: "India",
	US: "United States of America",
};

export const CountryZod = z.enum(Object.keys(Countries));

export type CountryCodes = keyof typeof Countries;

/** ISO 4217 currency used in each country. */
export const CountryCurrencies: Record<CountryCodes, CurrencyCodes> = {
	IN: "INR",
	US: "USD",
};

/** Human-readable country name for a country code. */
export const getCountryName = (code: string) =>
	(Countries as Record<string, string | undefined>)[code] ?? code;

/** ISO 4217 currency code used in a country. */
export const getCountryCurrency = (code: string) =>
	(CountryCurrencies as Record<string, CurrencyCodes | undefined>)[code];

/** Currency symbol used in a country. */
export const getCountryCurrencySymbol = (code: string) => {
	const currency = getCountryCurrency(code);
	return currency ? getCurrencySymbol(currency) : code;
};

/**
 * Resolve a free-text country (e.g. `student.address.country`) to a
 * `CountryCodes` key by matching either the code or the country name.
 */
export const resolveCountryCode = (
	country?: string | null,
): CountryCodes | undefined => {
	if (!country) return undefined;

	const value = country.trim().toLowerCase();
	const match = (Object.entries(Countries) as [CountryCodes, string][]).find(
		([code, name]) =>
			code.toLowerCase() === value || name.toLowerCase() === value,
	);

	return match?.[0];
};

/**
 * Default fee for a program, taken from the price of the given country.
 * Falls back to the first available price when the country cannot be resolved.
 */
export const resolveDefaultAmount = (
	price: Partial<Record<CountryCodes, number>>,
	country?: string | null,
) => {
	const code = resolveCountryCode(country);

	if (code && price[code] !== undefined) return price[code];

	const [first] = Object.values(price);
	return first ?? 0;
};
