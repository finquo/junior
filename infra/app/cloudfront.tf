variable "domain_name" {
	description	= "Public CloudFront domain"
	type		= string
}

locals {
	assets_prefix	= "_assets"

	open_next	= jsondecode(file("../../frontend/.open-next/open-next.output.json"))

	# The S3-origin behaviors from OpenNext's generated `open-next.output.json`.
	# Everything not listed here (the `*` behavior) goes to the Lambda.
	asset_behaviors	= [for b in local.open_next.behaviors : b.pattern if b.origin == "s3"]
}

resource "aws_acm_certificate" "cloudfront" {
	provider		= aws.global
	domain_name		= var.domain_name
	validation_method	= "DNS"

	lifecycle {
		create_before_destroy	= true
	}
}

resource "aws_acm_certificate_validation" "cloudfront" {
	provider		= aws.global
	certificate_arn		= aws_acm_certificate.cloudfront.arn
	validation_record_fqdns	= [
		for option in aws_acm_certificate.cloudfront.domain_validation_options :
		option.resource_record_name
	]
}

resource "aws_cloudfront_origin_access_control" "assets" {
	name				= "finquo-junior-assets-${var.environment}"
	description			= "CloudFront access to the OpenNext static assets"
	origin_access_control_origin_type	= "s3"
	signing_behavior		= "always"
	signing_protocol		= "sigv4"
}

resource "aws_cloudfront_distribution" "assets" {
	enabled	= true
	comment	= "finquo-junior"
	aliases	= [var.domain_name]

	origin {
		domain_name	= trimsuffix(replace(aws_lambda_function_url.next.function_url, "https://", ""), "/")
		origin_id	= "next"

		custom_origin_config {
			http_port		= 80
			https_port		= 443
			origin_protocol_policy	= "https-only"
			origin_ssl_protocols	= ["TLSv1.2"]
		}
	}

	origin {
		domain_name			= aws_s3_bucket.media.bucket_regional_domain_name
		origin_id			= "assets"
		origin_path			= "/${local.assets_prefix}"
		origin_access_control_id	= aws_cloudfront_origin_access_control.assets.id
	}

	default_cache_behavior {
		target_origin_id	= "next"
		viewer_protocol_policy	= "redirect-to-https"
		allowed_methods		= ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
		cached_methods		= ["GET", "HEAD", "OPTIONS"]
		compress		= true

		# Managed-CachingDisabled: the Next server sets its own cache headers.
		cache_policy_id			= "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
		# Managed-AllViewerExceptHostHeader
		origin_request_policy_id	= "b689b0a8-53d0-40ab-baf2-68738e2966ac"
	}

	dynamic "ordered_cache_behavior" {
		for_each	= local.asset_behaviors

		content {
			path_pattern		= ordered_cache_behavior.value
			target_origin_id	= "assets"
			viewer_protocol_policy	= "redirect-to-https"
			allowed_methods		= ["GET", "HEAD", "OPTIONS"]
			cached_methods		= ["GET", "HEAD", "OPTIONS"]
			compress		= true

			# Managed-CachingOptimized
			cache_policy_id	= "658327ea-f89d-4fab-a63d-7e88639e58f6"
		}
	}

	restrictions {
		geo_restriction {
			restriction_type	= "none"
		}
	}

	viewer_certificate {
		acm_certificate_arn		= aws_acm_certificate_validation.cloudfront.certificate_arn
		ssl_support_method		= "sni-only"
		minimum_protocol_version	= "TLSv1.2_2021"
	}
}

resource "aws_s3_bucket_policy" "assets" {
	bucket	= aws_s3_bucket.media.id

	policy	= jsonencode({
		Version		= "2012-10-17"
		Statement	= [
			{
				Sid		= "AllowCloudFrontStaticAssets"
				Effect		= "Allow"
				Principal	= {
					Service	= "cloudfront.amazonaws.com"
				}
				Action		= "s3:GetObject"
				Resource	= "${aws_s3_bucket.media.arn}/${local.assets_prefix}/*"
				Condition	= {
					StringEquals	= {
						"AWS:SourceArn"	= aws_cloudfront_distribution.assets.arn
					}
				}
			}
		]
	})
}

output "cloudfront_domain_name" {
	value = aws_cloudfront_distribution.assets.domain_name
}

output "cloudfront_distribution_id" {
	value = aws_cloudfront_distribution.assets.id
}

output "cloudfront_certificate_validation" {
	value = [
		for option in aws_acm_certificate.cloudfront.domain_validation_options : {
			name	= option.resource_record_name
			type	= option.resource_record_type
			value	= option.resource_record_value
		}
	]
}
