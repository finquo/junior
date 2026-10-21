import {
	createHmac,
	timingSafeEqual as nodeTimingSafeEqual,
} from "node:crypto";
import { sign } from "hono/jwt";
import { triedAsync } from "utils";

export function hmacSha256Hex(secret: string, message: string) {
	return createHmac("sha256", secret).update(message).digest("hex");
}

export function timingSafeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;

	return nodeTimingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function generateZoomToken(sessionName: string, role = 0) {
	const iat = Math.round(Date.now() / 1000) - 30;
	const exp = iat + 60 * 60 * 2;

	return sign(
		{
			app_key: process.env.ZOOM_SDK_KEY,
			tpc: sessionName,
			role_type: role,
			version: 1,
			iat,
			exp,
		},
		process.env.ZOOM_SDK_SECRET,
	);
}

export const tryAPI = async <D, Def = D>(
	tag: string,
	promise: Promise<D>,
	def?: Def,
) => {
	const { error, data } = await triedAsync(promise, tag);
	if (error) console.error(tag, error);
	return data ?? def;
};
