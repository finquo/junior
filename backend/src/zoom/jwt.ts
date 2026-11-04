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
	data: {
		id: string;
		user: string;
	},
	role: "host" | "guest",
) {
	const iat = Math.round(Date.now() / 1000) - 30;
	const exp = iat + 60 * 60 * 2;

	return sign(
		{
			app_key: process.env.ZOOM_SDK_KEY,
			tpc: data.id,
			session_key: data.id,
			role_type: role === "host" ? 1 : 0,
			user_key: data.user,
			user_identity: data.user,
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
