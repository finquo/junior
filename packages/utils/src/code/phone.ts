import z from "zod";

/** E.164 international phone number, e.g. `+919876543210`. */
export const PhoneNumberZod = z
	.string()
	.trim()
	.regex(
		/^\+[1-9]\d{6,14}$/,
		"Enter a valid E.164 phone number (e.g. +919876543210)",
	);

/**
 * Returns a WhatsApp `https://wa.me/<number>`
 */
export function getWhatsappLink(phone: string, text?: string): string {
	const cleanNumber = phone.replace(/\D/g, "");

	if (!cleanNumber) return "";

	if (text) {
		return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}` as const;
	}
	return `https://wa.me/${cleanNumber}` as const;
}
