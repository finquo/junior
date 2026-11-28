resource "aws_cloudwatch_log_group" "event" {
	name			= "/aws/lambda/finquo-junior-event-${var.environment}"
	retention_in_days	= 14
}

resource "aws_iam_role" "event_lambda" {
	name	= "finquo-junior-event-lambda-${var.environment}"

	assume_role_policy	= jsonencode({
		Version		= "2012-10-17"
		Statement	= [
			{
				Effect		= "Allow"
				Principal	= {
					Service	= "lambda.amazonaws.com"
				}
				Action		= "sts:AssumeRole"
			}
		]
	})
}

resource "aws_iam_role_policy" "event_lambda_logs" {
	name	= "finquo-junior-event-lambda-logs-${var.environment}"
	role	= aws_iam_role.event_lambda.id

	policy	= jsonencode({
		Version		= "2012-10-17"
		Statement	= [
			{
				Effect		= "Allow"
				Action		= ["logs:CreateLogStream", "logs:PutLogEvents"]
				Resource	= "${aws_cloudwatch_log_group.event.arn}:*"
			}
		]
	})
}

resource "aws_iam_role_policy" "event_lambda_media" {
	name	= "finquo-junior-event-lambda-media-${var.environment}"
	role	= aws_iam_role.event_lambda.id

	policy	= jsonencode({
		Version	= "2012-10-17"
		Statement	= [
			{
				Effect	= "Allow"
				Action	= ["s3:ListBucket"]
				Resource	= aws_s3_bucket.media.arn
			},
			{
				Effect	= "Allow"
				Action	= ["s3:GetObject", "s3:PutObject"]
				Resource	= "${aws_s3_bucket.media.arn}/*"
			},
			{
				Effect	= "Allow"
				Action	= ["mediaconvert:CreateJob"]
				Resource	= aws_media_convert_queue.media.arn
			},
			{
				Effect	= "Allow"
				Action	= "iam:PassRole"
				Resource	= aws_iam_role.media_convert.arn
			}
		]
	})
}

resource "aws_lambda_function" "event" {
	function_name		= "finquo-junior-event-${var.environment}"
	role			= aws_iam_role.event_lambda.arn

	# Code is deployed by .github/workflows/event.yml via `aws lambda update-function-code`.
	# Terraform only creates the function, so changes to the zip are ignored here.
	filename		= "../../event.zip"

	runtime			= "nodejs22.x"
	handler			= "index.handler"
	architectures	= ["x86_64"]

	memory_size		= 512
	timeout			= 30

	environment {
		variables	= local.next_env
	}

	depends_on		= [aws_cloudwatch_log_group.event]

	lifecycle {
		ignore_changes	= [filename, source_code_hash]
	}
}

resource "aws_lambda_permission" "event_s3" {
	statement_id	= "AllowExecutionFromMediaBucket"
	action		= "lambda:InvokeFunction"
	function_name	= aws_lambda_function.event.function_name
	principal	= "s3.amazonaws.com"
	source_arn	= aws_s3_bucket.media.arn
}

resource "aws_s3_bucket_notification" "course_video_source" {
	bucket		= aws_s3_bucket.media.id
	depends_on	= [aws_lambda_permission.event_s3]

	lambda_function {
		lambda_function_arn	= aws_lambda_function.event.arn
		events			= ["s3:ObjectCreated:*"]
		filter_prefix		= "course/"
		filter_suffix		= "/source/video.mp4"
	}
}

resource "aws_iam_role" "event_scheduler" {
	name	= "finquo-junior-event-scheduler-${var.environment}"

	assume_role_policy	= jsonencode({
		Version		= "2012-10-17"
		Statement	= [
			{
				Effect		= "Allow"
				Principal	= {
					Service	= "scheduler.amazonaws.com"
				}
				Action		= "sts:AssumeRole"
			}
		]
	})
}

resource "aws_iam_role_policy" "event_scheduler_invoke" {
	name	= "finquo-junior-event-scheduler-invoke-${var.environment}"
	role	= aws_iam_role.event_scheduler.id

	policy	= jsonencode({
		Version		= "2012-10-17"
		Statement	= [
			{
				Effect		= "Allow"
				Action		= "lambda:InvokeFunction"
				Resource	= aws_lambda_function.event.arn
			}
		]
	})
}

output "event_function_name" {
	value = aws_lambda_function.event.function_name
}

output "event_function_arn" {
	value = aws_lambda_function.event.arn
}

output "event_scheduler_role_arn" {
	value = aws_iam_role.event_scheduler.arn
}
