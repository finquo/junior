import { createHmac } from "node:crypto";
import {
	generateZoomToken,
	hmacSha256Hex,
	timingSafeEqual,
} from "../backend/src/zoom/jwt";

function assert(label: string, condition: boolean) {
	if (!condition) throw new Error(`FAIL: ${label}`);
	console.log(`ok - ${label}`);
}

assert(
	"hmacSha256Hex matches the known SHA-256 vector",
	hmacSha256Hex("key", "The quick brown fox jumps over the lazy dog") ===
		"f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
);

assert(
	"timingSafeEqual accepts identical strings",
	timingSafeEqual("abc", "abc"),
);
assert(
	"timingSafeEqual rejects different strings",
	!timingSafeEqual("abc", "abd"),
);
assert(
	"timingSafeEqual rejects different lengths",
	!timingSafeEqual("abc", "abcd"),
);

process.env.ZOOM_SDK_KEY = "test-sdk-key";
process.env.ZOOM_SDK_SECRET = "test-sdk-secret";

const token = await generateZoomToken("session-test");
const [header, payload, signature] = token.split(".");

const expectedSignature = createHmac("sha256", process.env.ZOOM_SDK_SECRET)
	.update(`${header}.${payload}`)
	.digest("base64url");

assert(
	"jwt signature matches an independent HMAC",
	signature === expectedSignature,
);

const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
assert("jwt round-trips the session topic", claims.tpc === "session-test");
assert("jwt carries the sdk key", claims.app_key === "test-sdk-key");
assert("jwt carries the role type", claims.role_type === 0);

console.log("\nAll checks passed.");
