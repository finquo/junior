import {
	DeleteObjectCommand,
	GetObjectCommand,
	type GetObjectCommandOutput,
	HeadObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { defineDriver } from "unstorage";
import { bucket } from "./bucket";

const isMissing = (error: unknown) =>
	error instanceof Error &&
	["NoSuchKey", "NotFound"].includes((error as { name?: string }).name ?? "");

/**
 * unstorage custom S3 driver built on the AWS SDK instead of aws4fetch.
 */
export const s3Driver = defineDriver((options: { bucket: string }) => {
	const getObject = async (
		key: string,
	): Promise<GetObjectCommandOutput | null> => {
		try {
			return await bucket.send(
				new GetObjectCommand({ Bucket: options.bucket, Key: key }),
			);
		} catch (error) {
			if (isMissing(error)) return null;
			throw error;
		}
	};

	return {
		name: "s3-aws-sdk",
		options,
		async getItem(key) {
			const res = await getObject(key);
			return res?.Body ? res.Body.transformToString() : null;
		},
		async getItemRaw(key) {
			const res = await getObject(key);
			return res?.Body ? res.Body.transformToByteArray() : null;
		},
		async setItem(key, value) {
			await bucket.send(
				new PutObjectCommand({
					Bucket: options.bucket,
					Key: key,
					Body: value,
				}),
			);
		},
		async setItemRaw(key, value) {
			await bucket.send(
				new PutObjectCommand({
					Bucket: options.bucket,
					Key: key,
					Body: value instanceof ArrayBuffer ? new Uint8Array(value) : value,
				}),
			);
		},
		async getMeta(key) {
			try {
				const res = await bucket.send(
					new HeadObjectCommand({ Bucket: options.bucket, Key: key }),
				);
				return { size: String(res.ContentLength ?? 0) };
			} catch (error) {
				if (isMissing(error)) return null;
				throw error;
			}
		},
		async hasItem(key) {
			try {
				await bucket.send(
					new HeadObjectCommand({ Bucket: options.bucket, Key: key }),
				);
				return true;
			} catch (error) {
				if (isMissing(error)) return false;
				throw error;
			}
		},
		async getKeys(base) {
			const keys: string[] = [];
			let token: string | undefined;

			do {
				const res = await bucket.send(
					new ListObjectsV2Command({
						Bucket: options.bucket,
						Prefix: base,
						ContinuationToken: token,
					}),
				);

				for (const item of res.Contents ?? []) {
					if (item.Key) keys.push(item.Key);
				}

				token = res.NextContinuationToken;
			} while (token);

			return keys;
		},
		async removeItem(key) {
			await bucket.send(
				new DeleteObjectCommand({ Bucket: options.bucket, Key: key }),
			);
		},
	};
});
