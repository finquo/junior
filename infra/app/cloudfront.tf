locals {
	assets_prefix	= "_assets"

	# The S3-origin behaviors from OpenNext's generated `open-next.output.json`.
	# Everything not listed here (the `*` behavior) goes to the Lambda.
	asset_behaviors	= [
		"BUILD_ID",
		"coi-serviceworker.js",
		"favicon/*",
		"favicon.ico",
		"logo.png",
		"offline.html",
		"sw.js",
		"_next/*",
	]
}

resource "aws_cloudfront_origin_access_control" "assets" {
	name				= "finquo-junior-assets"
	description			= "CloudFront access to the OpenNext static assets"
	origin_access_control_origin_type	= "s3"
	signing_behavior		= "always"
	signing_protocol		= "sigv4"
}

resource "aws_cloudfront_distribution" "assets" {
	enabled	= true
	comment	= "finquo-junior"

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
		cloudfront_default_certificate	= true
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
