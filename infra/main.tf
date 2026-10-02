terraform {
	required_providers {
		aws = {
			source	= "hashicorp/aws"
			version	= "~> 6.0"
		}
 	}

	backend "s3" {
		bucket	= "finquo-app-opentofu-state"
		key		= "infra/terraform.tfstate"
		region	= "ap-south-1"
	}
}

provider "aws" {
	region	= "ap-south-1"
	alias	= "main"
}


provider "aws" {
	region	= "us-east-1"
	alias	= "global"
}

data "aws_region" "main" {
	provider = aws.main
}
