export const getAllowedHosts = () => {
	const allowedHosts = [];

	if (process.env.ENVIRONMENT === "production")
		allowedHosts.push("*.finquo.ai");
	else
		allowedHosts.push(
			"finquo.ai",
			"*.finquo.ai",
			"*.vercel.app",
			"*.cloudfront.net",
		);

	if (process.env.TRUSTED_HOST) allowedHosts.push(process.env.TRUSTED_HOST);

	if (process.env.NODE_ENV === "development")
		allowedHosts.push("localhost:4000");

	return allowedHosts;
};

export const getOrigin = () => {
	const origin = getAllowedHosts().map((h) => `https://${h}`);

	if (process.env.NODE_ENV === "development")
		origin.push("http://localhost:4000");

	return origin;
};
