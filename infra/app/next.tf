locals {
	env_json	= jsondecode(file("../../env.json"))

	next_env	= merge(
		{
			for k, v in local.env_json : k => tostring(v)
			if try(tostring(v), null) != null
		},
		{
			NODE_ENV		= "production"
			DATABASE_URL		= data.aws_ssm_parameter.database_url.value
			DATABASE_URL_DIRECT	= data.aws_ssm_parameter.database_url.value
		}
	)
}

data "aws_ssm_parameter" "database_url" {
	name	= "/finquo/db/url"
}

resource "aws_cloudwatch_log_group" "next" {
	name			= "/aws/lambda/finquo-next"
	retention_in_days	= 14
}

resource "aws_iam_role" "next_lambda" {
	name	= "finquo-next-lambda"

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

resource "aws_iam_role_policy" "next_lambda_logs" {
	name	= "finquo-next-lambda-logs"
	role	= aws_iam_role.next_lambda.id

	policy	= jsonencode({
		Version		= "2012-10-17"
		Statement	= [
			{
				Effect		= "Allow"
				Action		= ["logs:CreateLogStream", "logs:PutLogEvents"]
				Resource	= "${aws_cloudwatch_log_group.next.arn}:*"
			}
		]
	})
}

resource "aws_lambda_function" "next" {
	function_name		= "finquo-next"
	role			= aws_iam_role.next_lambda.arn

	filename		= "../../build.zip"
	source_code_hash	= filebase64sha256("../../build.zip")

	runtime			= "nodejs22.x"
	handler			= "index.handler"
	architectures		= ["x86_64"]

	memory_size		= 1024
	timeout			= 30

	environment {
		variables	= local.next_env
	}

	depends_on		= [aws_cloudwatch_log_group.next]
}

resource "aws_lambda_function_url" "next" {
	function_name		= aws_lambda_function.next.function_name
	authorization_type	= "NONE"
	invoke_mode		= "BUFFERED"
}

output "next_function_url" {
	value = aws_lambda_function_url.next.function_url
}

output "next_function_name" {
	value = aws_lambda_function.next.function_name
}

output "next_log_group_name" {
	value = aws_cloudwatch_log_group.next.name
}
