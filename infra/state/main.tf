terraform {
	required_providers {
		aws = {
			source	= "hashicorp/aws"
			version	= "~> 6.0"
		}
	}

	backend "s3" {
		key				= "state/terraform.tfstate"
		region			= "ap-south-1"
		use_lockfile	= true
	}
}

variable "environment" {
	description	= "Deployment environment"
	type		= string
	default		= "development"
}

provider "aws" {
	region	= "ap-south-1"

	default_tags {
		tags = {
			Project		= "finquo"
			Environment	= var.environment
			ManagedBy	= "opentofu"
		}
	}
}
