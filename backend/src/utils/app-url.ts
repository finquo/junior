export const appOrigin = (requestUrl: string, path = "") =>
	`${process.env.DOMAIN_NAME ? `https://${process.env.DOMAIN_NAME}` : new URL(requestUrl).origin}${path}`;
