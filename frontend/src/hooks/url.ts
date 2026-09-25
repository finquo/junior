"use client";

export const getServerBaseUrl = (paths?: string) =>
	(process.env.NEXT_PUBLIC_SERVER_URL ??
		(typeof window !== "undefined"
			? window.location.origin
			: "http://localhost:3000")) + (paths ? paths : "");

export const getClientBaseUrl = (paths?: string) =>
	(typeof window !== "undefined"
		? window.location.origin
		: "http://localhost:3000") + (paths ? paths : "");
