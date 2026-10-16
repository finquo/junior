import z from "zod";

export const Languages = {
	"ml-IN": "Malayalam (India)",
	"en-IN": "English (India)",
};

export const LanguageCodeKey = ["ml-IN", "en-IN"] as const;
export type LanguageCodes = keyof typeof Languages;

export const LanguageCodeZod = z.enum(LanguageCodeKey);

/** Human-readable language name for a language code. */
export const getLanguageName = (code: string) =>
	(Languages as Record<string, string | undefined>)[code] ?? code;
