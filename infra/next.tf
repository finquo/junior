variable "github_run_id" {
	type	= string
	default = "local_run_id"
}

resource "aws_acm_certificate" "app-cert" {
	provider			= aws.global
	domain_name			= "app.finquo.ai"
	validation_method	= "DNS"

	lifecycle {
		create_before_destroy = true
	}
}

module "opennext" {
	source = "terranext-dev/opennext/aws"
	version = "v2.1.0"

	tags = {
		github_run_id = var.github_run_id
	}

	name				= "Finquo App"
	slug				= "finquo-app-opennext"
	opennext_build_path	= "../frontend/.open-next"

	aws_region			= data.aws_region.main.region
	deployment_domain	= aws_acm_certificate.app-cert.domain_name
	acm_arn				= aws_acm_certificate.app-cert.arn
}

output "domain" {
	value = module.opennext.cloudfront_distribution_domain_name
}

output "cname_data" {
	value = aws_acm_certificate.app-cert.domain_validation_options
}
