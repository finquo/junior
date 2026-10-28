data "aws_iam_policy_document" "amplify_trust" {
	statement {
		actions	= ["sts:AssumeRole"]
		effect	= "Allow"

		principals {
			type	= "Service"
			identifiers	= ["://amazonaws.com"]
		}
	}
}

resource "aws_iam_role" "amplify_role" {
	name	= "AmplifyConsoleServiceRole"
	assume_role_policy	= data.aws_iam_policy_document.amplify_trust.json

	tags	= {
		Environment	= "production"
		ManagedBy	= "OpenTofu"
	}
}

resource "aws_iam_role_policy_attachment" "amplify_admin_attach" {
	role		= aws_iam_role.amplify_role.name
	policy_arn	= "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}


resource "aws_amplify_app" "finquo-junior-app" {
	name	= "junior"

	iam_service_role_arn	= aws_iam_role.amplify_role.arn

	# NOTE: If the app already exists in AWS, import it using:
	# tofu import aws_amplify_app.finquo-junior-app d1jtdrl3cxfdu9
}
