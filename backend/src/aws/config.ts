export const AWS_REGION = "ap-south-1";
export const BUCKET_ENDPOINT = `https://s3.${AWS_REGION}.amazonaws.com`;
export const MEDIA_CONVERT_ENDPOINT = `https://REPLACE.mediaconvert.${AWS_REGION}.amazonaws.com`;

export const MEDIA_BUCKET = "finquo-media-bucket";

export const MEDIA_CONVERT_ROLE_ARN = "arn:aws:iam::REPLACE_ACCOUNT_ID:role/REPLACE_MEDIA_CONVERT_ROLE";
export const MEDIA_CONVERT_QUEUE_ARN = `arn:aws:mediaconvert:${AWS_REGION}:REPLACE_ACCOUNT_ID:queues/Default`;
