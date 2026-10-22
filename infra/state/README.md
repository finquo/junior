# state

The shared, stateful infrastructure for one AWS account: today the Postgres instance, tomorrow Redis, RabbitMQ, or anything else that must outlive the app stacks. Its own OpenTofu root, with its own state (`state/terraform.tfstate`, same bucket as the app stack).

`development` and `production` live in **separate AWS accounts**, so this root is applied once per account with identical resource names — each account has its own bucket, state, database, and SSM parameter.

App stacks never build the database URL themselves. `db.tf` publishes it to SSM SecureString `/finquo-junior/db/url`, and each deployment reads it:

```hcl
data "aws_ssm_parameter" "database_url" {
	name = "/finquo-junior/db/url"
}
```

## Prerequisites

- AWS credentials for the account, via `AWS_*` environment variables or your profile. Tofu never reads `.env`.
- `../../env.json` at the repo root, because the master password comes from it:

```powershell
$json = bunx varlock load --format json 2>$null | Out-String
if ($LASTEXITCODE -ne 0 -or -not $json.Trim().StartsWith("{")) { throw "varlock produced no JSON" }
[System.IO.File]::WriteAllText("$PWD\env.json", $json.Trim())
```

- `DB_PASSWORD` in the root `.env` (and in GitHub secrets). Declared in `.env.schema`, at least 24 characters, and no `/`, `"`, `@`, or spaces — RDS rejects those. The same value must exist locally and in CI; applying with a different value rotates the database password.

## Apply

The state bucket is not in the backend block (S3 bucket names are global, so each environment needs its own), which means every init must name it:

```powershell
cd infra/state
tofu init -backend-config="bucket=finquo-junior-opentofu-development"
tofu validate
tofu plan -out=tfplan
tofu apply tfplan
```

| Environment | State bucket | Media bucket |
|---|---|---|
| development | `finquo-junior-opentofu-development` | `finquo-junior-media-development` |
| production | `finquo-junior-opentofu-production` | `finquo-junior-media-production` |

Each environment's state bucket is created once, by hand, in that environment's account:

```bash
# development
aws s3api create-bucket --bucket finquo-junior-opentofu-development --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1
aws s3api put-bucket-versioning --bucket finquo-junior-opentofu-development --versioning-configuration Status=Enabled

# production
aws s3api create-bucket --bucket finquo-junior-opentofu-production --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1
aws s3api put-bucket-versioning --bucket finquo-junior-opentofu-production --versioning-configuration Status=Enabled
```

`aws_db_instance` takes 8-15 minutes. After it completes:

```powershell
tofu output -raw database_url
aws ssm get-parameter --name /finquo-junior/db/url --with-decryption --query Parameter.Value --output text
```

## Environment tag

`main.tf` declares:

```hcl
variable "environment" {
	type		= string
	default		= "development"
}
```

CI passes it as `TF_VAR_environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'development' }}`, and it feeds `default_tags.Environment`. It is a **tag only** — no resource name includes it, so the same stack is byte-identical in both accounts. Locally, override it with `$env:TF_VAR_environment = "staging"`.

## What this stack owns

| Resource | Notes |
|---|---|
| `aws_db_instance.db` | `postgres 17`, `db.t4g.micro`, gp3 20 GB autoscaling to 100 GB, 7-day backups, encrypted, publicly reachable, database `junior`, master user `finquo` |
| `aws_security_group.db` | 5432 open to `0.0.0.0/0` because Lambda and GitHub runner IPs are not stable. TLS + password are the gate |
| `aws_db_subnet_group.db` | default VPC subnets in `ap-south-1a/b/c` |
| `aws_ssm_parameter.database_url` | `/finquo-junior/db/url`, the contract every deployment reads |

Deliberately absent: RDS Proxy (no pooler), Multi-AZ, Performance Insights, log exports, enhanced monitoring. `max: 1` in the backend's postgres client is what keeps `db.t4g.micro` (~112 connections) from being exhausted by Lambda concurrency.

## Migrations

Migrations are owned by CI, not by this stack and never by the app at boot. `.github/workflows/state.yml` runs:

1. `tofu apply` here
2. `bun run db:migrate` in `backend/`, with `DATABASE_URL` from `tofu output -raw database_url`

Never run two migration jobs at once — the `deploy-<ref>` concurrency group exists for that.

## Rotating the database password

Changing `DB_PASSWORD` changes the master password. Existing connections survive; only new connections need the new value.

1. Generate a new value (32 alphanumeric characters):

```powershell
$alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
-join ($bytes | ForEach-Object { $alphabet[$_ % 62] })
```

2. Update `.env` and the `DB_PASSWORD` GitHub secret with the same value.
3. Regenerate `env.json`.
4. Run `state.yml`, or apply locally: state → migrate → app.

Existing connections keep working; new Lambda containers pick up the new URL only after the app stack is applied. The instance is modified in place: same endpoint, same data, only credentials change. Changing `identifier`, `db_name`, `storage_encrypted`, or the major `engine_version` would replace it.

Do not add `lifecycle { ignore_changes = [password] }` — it would silently break rotation.

## Adding another stateful resource

Keep each feature self-contained in its own file (`redis.tf`, `queue.tf`), the same convention as `media.tf` in `infra/app`. Everything here is shared by every deployment in the account.

## Sharing config between roots

A `.tf` file cannot be imported into another root. `terraform { backend }` and `provider` blocks must exist once per root, which is why `infra/state/main.tf` and `infra/app/main.tf` are similar but separate. What can be shared:

| Need | Mechanism |
|---|---|
| Share data between roots | `data` source — SSM today, `terraform_remote_state` if you ever need more fields |
| Same backend bucket, separate state | different `key` per root (`app/terraform.tfstate` vs `state/terraform.tfstate`). Locks are per key (`<key>.tflock`), so applies in different roots never block each other |
| Share provider configuration | duplicate the ~20-line provider block, or introduce Terragrunt later |

Do not point two roots at the same `key`. They would overwrite each other's state, and the lock would serialize applies that should be independent.

## Destroy

```powershell
tofu init -backend-config="bucket=finquo-junior-opentofu-development"
tofu plan -destroy   # review first
tofu destroy
```

`skip_final_snapshot = true` and `deletion_protection = false` mean destruction is immediate and **unrecoverable**. This database is shared by every deployment in the account. Flip both settings before this holds anything you care about.
