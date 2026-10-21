import { S3Client } from "@aws-sdk/client-s3";
import { AWS_REGION, BUCKET_ENDPOINT } from "./config";

export const bucket = new S3Client({
	region: AWS_REGION,
	endpoint: BUCKET_ENDPOINT,
	forcePathStyle: true,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});
