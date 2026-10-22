![Infra Diagram](./docs/infra.png)

# Finquo Infra

### AWS Account

1. Go to [AWS](https://ap-south-1.signin.aws.amazon.com/)
2. Create or Login to root account
3. Create a new user in [IAM](https://ap-south-1.console.aws.amazon.com/iam)
4. Attach "AdministratorAccess" policy to user
5. After creation, go to the user's Security credentials section
6. Create an "Access keys" with use case "Command Line Interface (CLI)"
7. Download the .csv file containing the access key ID & Secret
8. Create the OpenTofu state bucket **in that account**. S3 names are global, so each environment gets its own — run only the one matching the account you are in:

```bash
# development (local account)
aws s3api create-bucket --bucket finquo-junior-opentofu-development --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1

# production (separate account)
aws s3api create-bucket --bucket finquo-junior-opentofu-production --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1
```

9. Turn on versioning, so a corrupted state file can be rolled back:

```bash
# development
aws s3api put-bucket-versioning --bucket finquo-junior-opentofu-development --versioning-configuration Status=Enabled

# production
aws s3api put-bucket-versioning --bucket finquo-junior-opentofu-production --versioning-configuration Status=Enabled
```

10. Pass the bucket to every `tofu init`, since it is intentionally not in the `backend` block:

```bash
cd infra/state
tofu init -backend-config="bucket=finquo-junior-opentofu-development"   # or finquo-junior-opentofu-production
```

The media bucket (`finquo-junior-media-<environment>`) is created by Terraform, not by hand.
