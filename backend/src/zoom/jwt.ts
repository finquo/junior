import {
	createHmac,
	timingSafeEqual as nodeTimingSafeEqual,
} from "node:crypto";
import { sign } from "hono/jwt";

export function hmacSha256Hex(secret: string, message: string) {
	return createHmac("sha256", secret).update(message).digest("hex");
}

export function timingSafeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;

	return nodeTimingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function generateZoomToken(
	id: string,
	role: "guest",
): Promise<string>;

export async function generateZoomToken(
	id: string,
	role: "host" | "user",
	user: string,
): Promise<string>;

export async function generateZoomToken(
	id: string,
	role: "host" | "user" | "guest",
	user?: string,
): Promise<string> {
	const iat = Math.round(Date.now() / 1000) - 30;
	const exp = iat + 60 * 60 * 2;
	const userId = user ?? `guest-${crypto.randomUUID()}`;

	return sign(
		{
			app_key: process.env.ZOOM_SDK_KEY,
			tpc: id,
			session_key: id,
			role_type: role === "host" ? 1 : 0,
			user_key: userId,
			user_identity: userId,
			cloud_recording_option: 1,
			version: 1,
			iat,
			exp,
		},
		process.env.ZOOM_SDK_SECRET,
	);
}

export function generateZoomAPIToken() {
	const iat = Math.floor(Date.now() / 1000);
	const exp = iat + 60 * 60 * 2;

	return sign(
		{
			iss: process.env.ZOOM_API_ID,
			iat,
			exp,
		},
		process.env.ZOOM_API_KEY,
	);
}
