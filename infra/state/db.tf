locals {
	env_json	= jsondecode(file("../../env.json"))

	# Master password for the shared instance, declared in the root .env.schema.
	# RDS rejects "/", "\"", "@" and spaces, so the value must never contain them.
	# The same value must exist locally and in GitHub secrets, otherwise an apply
	# with the other value silently rotates the database password.
	db_password	= local.env_json["DB_PASSWORD"]

	db_url		= "postgresql://${aws_db_instance.db.username}:${local.db_password}@${aws_db_instance.db.address}:${aws_db_instance.db.port}/${aws_db_instance.db.db_name}"
}

data "aws_vpc" "default" {
	default	= true
}

data "aws_subnets" "default" {
	filter {
		name	= "vpc-id"
		values	= [data.aws_vpc.default.id]
	}
}

resource "aws_db_subnet_group" "db" {
	name		= "finquo-junior-db"
	subnet_ids	= data.aws_subnets.default.ids
}

resource "aws_security_group" "db" {
	name		= "finquo-junior-db"
	description	= "Postgres access for all finquo deployments"
	vpc_id		= data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "db_postgres" {
	security_group_id	= aws_security_group.db.id

	description	= "Postgres from Lambda and the GitHub runner"
	ip_protocol	= "tcp"
	from_port	= 5432
	to_port		= 5432
	cidr_ipv4	= "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "db_all" {
	security_group_id	= aws_security_group.db.id

	description	= "Allow all outbound (responses)"
	ip_protocol	= "-1"
	cidr_ipv4	= "0.0.0.0/0"
}

resource "aws_db_instance" "db" {
	identifier		= "finquo-junior-db"
	engine			= "postgres"
	engine_version		= "17"
	instance_class		= "db.t4g.micro"

	allocated_storage	= 20
	max_allocated_storage	= 100
	storage_type		= "gp3"
	storage_encrypted	= true

	db_name			= "junior"
	username		= "finquo"
	password		= local.db_password

	db_subnet_group_name	= aws_db_subnet_group.db.name
	vpc_security_group_ids	= [aws_security_group.db.id]
	publicly_accessible	= true

	backup_retention_period	= 7
	skip_final_snapshot	= true
	deletion_protection	= false
	apply_immediately	= true
}

resource "aws_ssm_parameter" "database_url" {
	name	= "/finquo-junior/db/url"
	type	= "SecureString"
	value	= local.db_url
}

output "database_url" {
	value		= local.db_url
	sensitive	= true
}

output "database_host" {
	value = aws_db_instance.db.address
}

output "database_name" {
	value = aws_db_instance.db.db_name
}

output "database_parameter_name" {
	value = aws_ssm_parameter.database_url.name
}
