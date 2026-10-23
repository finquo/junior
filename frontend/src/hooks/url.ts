"use client";

export const getServerBaseUrl = (paths?: string) => {
	let base = process.env.NEXT_PUBLIC_SERVER_URL;

	if (base) {
		if (
			typeof window !== "undefined" &&
			/^(https?:\/\/)(localhost|127\.0\.0\.1)/.test(base)
		) {
			base = base.replace(
				/^(https?:\/\/)(localhost|127\.0\.0\.1)/,
				`$1${window.location.hostname}`,
			);
		}
	} else if (typeof window !== "undefined") {
		base = window.location.origin;
	} else {
		base = "http://localhost:3000";
	}

	return base + (paths ? paths : "");
};

export const getClientBaseUrl = (paths?: string) =>
	(typeof window !== "undefined"
		? window.location.origin
		: "http://localhost:3000") + (paths ? paths : "");
