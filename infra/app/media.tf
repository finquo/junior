resource "aws_s3_bucket" "media" {
	bucket			= "finquo-junior-media-${var.environment}"
	force_destroy	= true
}

resource "aws_media_convert_queue" "media" {
	name			= "finquo-junior-media-queue"
	description		= "MediaConvert test queue"

	pricing_plan	= "ON_DEMAND"
	status			= "ACTIVE"
	region			= data.aws_region.main.region
}

resource "aws_iam_role" "media_convert" {
	name	= "finquo-junior-media-convert"

	assume_role_policy	= jsonencode({
		Version		= "2012-10-17"
		Statement	= [
			{
				Effect		= "Allow"
				Principal	= {
					Service	= "mediaconvert.amazonaws.com"
				}
				Action		= "sts:AssumeRole"
			}
		]
	})
}

resource "aws_iam_role_policy" "media_convert_s3" {
	name	= "finquo-junior-media-convert-s3"
	role	= aws_iam_role.media_convert.id

	policy	= jsonencode({
		Version	= "2012-10-17"
		Statement	= [
			{
				Effect		= "Allow"
				Action		= ["s3:ListBucket"]
				Resource	= aws_s3_bucket.media.arn
			},
			{
				Effect		= "Allow"
				Action		= ["s3:GetObject", "s3:PutObject"]
				Resource	= "${aws_s3_bucket.media.arn}/*"
			}
		]
	})
}

resource "aws_iam_role_policy" "media_lambda" {
	name	= "finquo-junior-next-lambda-media"
	role	= aws_iam_role.next_lambda.id

	policy	= jsonencode({
		Version		= "2012-10-17"
		Statement	= [
			{
				Effect		= "Allow"
				Action		= ["s3:ListBucket"]
				Resource	= aws_s3_bucket.media.arn
			},
			{
				Effect		= "Allow"
				Action		= ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
				Resource	= "${aws_s3_bucket.media.arn}/*"
			},
			{
				Effect		= "Allow"
				Action		= ["mediaconvert:CreateJob"]
				Resource	= aws_media_convert_queue.media.arn
			},
			{
				Effect		= "Allow"
				Action		= "iam:PassRole"
				Resource	= aws_iam_role.media_convert.arn
			}
		]
	})
}

output "bucket_name" {
	value = aws_s3_bucket.media.bucket
}

output "bucket_arn" {
	value = aws_s3_bucket.media.arn
}

output "queue_name" {
	value = aws_media_convert_queue.media.name
}

output "queue_arn" {
	value = aws_media_convert_queue.media.arn
}

output "media_convert_role_arn" {
	value = aws_iam_role.media_convert.arn
}
