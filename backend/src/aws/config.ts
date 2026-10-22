export const AWS_REGION = "ap-south-1";
export const BUCKET_ENDPOINT = `https://s3.${AWS_REGION}.amazonaws.com`;
export const MEDIA_CONVERT_ENDPOINT = `https://mediaconvert.${AWS_REGION}.amazonaws.com`;

export const ACCOUNT_ID = process.env.AWS_ACCOUNT_ID;
export const MEDIA_BUCKET = process.env.MEDIA_BUCKET ?? "finquo-junior-media-development";

export const MEDIA_CONVERT_ROLE_ARN = `arn:aws:iam::${ACCOUNT_ID}:role/finquo-junior-media-convert`;
export const MEDIA_CONVERT_QUEUE_ARN = `arn:aws:mediaconvert:${AWS_REGION}:${ACCOUNT_ID}:queues/finquo-junior-media-queue`;
