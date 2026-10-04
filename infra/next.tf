variable "github_run_id" {
	type	= string
	default = "local_run_id"
}

module "opennext" {
	source = "./modules/open-terra-next"

	tags = {
		github_run_id = var.github_run_id
	}

	name				= "Finquo App"
	slug				= "finquo-app-opennext"
	opennext_build_path	= "../frontend/.open-next"

	aws_region			= data.aws_region.main.region
}

output "domain" {
	value = "https://${module.opennext.cloudfront_distribution_domain_name}"
}
