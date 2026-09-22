![Infra Diagram](./docs/infra.png)

# Finquo App Infra

### AWS Account

1. Go to [AWS](https://ap-south-1.signin.aws.amazon.com/)
2. Create or Login to root account
3. Create a new user in [IAM](https://ap-south-1.console.aws.amazon.com/iam)
4. Attach "AdministratorAccess" policy to user
5. After creation, go to the user's Security credentials section
6. Create an "Access keys" with use case "Command Line Interface (CLI)"
7. Download the .csv file containing the access key ID & Secret
8. Create new S3 bucket for saving opentofu state

```bash
aws s3api create-bucket --bucket finquo-app-opentofu-state --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1
```
