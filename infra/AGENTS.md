# infra

Two independent OpenTofu roots. There is no `.tf` at this level, so always run `tofu` from inside a root.

- `app/` — Next.js Lambda from the CI-built OpenNext zip, Function URL, media S3 bucket + MediaConvert queue.
- `state/` — long-lived shared resources: RDS Postgres, its subnet group/SG, and the `/finquo-junior/db/url` SSM parameter. Put Redis/RabbitMQ here later.

## Commands

```bash
cd infra/state        # or infra/app
tofu init -backend-config="bucket=finquo-junior-opentofu-development"
tofu validate
tofu plan -out=tfplan
tofu apply tfplan
```

- After editing a `backend` block: `tofu init -reconfigure`.
- The state bucket `finquo-junior-opentofu-<environment>` must exist before the first `init` (see `README.md`).

## State

- One state bucket per environment (`finquo-junior-opentofu-development`, `finquo-junior-opentofu-production`), `use_lockfile = true`, fixed keys `app/terraform.tfstate` and `state/terraform.tfstate`. The bucket is deliberately **not** in the backend block — S3 names are global, so it is passed at init with `-backend-config="bucket=..."`. Never point two roots at the same key; locks are per key, so the roots can apply concurrently.
- `state` must be applied before `app`. `app/next.tf` reads the DB URL from the `/finquo-junior/db/url` SSM parameter that `state/db.tf` writes — there is no `terraform_remote_state` between the roots.
- `state` is shared by every deployment in the account: `skip_final_snapshot = true` and `deletion_protection = false` mean destroy is immediate and unrecoverable.
- One deployment per AWS account. Only names in **global** namespaces carry the environment: the state bucket (via init) and `finquo-junior-media-${var.environment}`. Lambda, IAM, RDS, SSM, and the MediaConvert queue are account-scoped and stay identical in both accounts.

## Environments

| | `development` | `production` |
|---|---|---|
| AWS account | local account | separate account |
| Trigger | local `tofu apply` (default tag) | push to `main` |
| State bucket | `finquo-junior-opentofu-development` | `finquo-junior-opentofu-production` |
| Media bucket | `finquo-junior-media-development` | `finquo-junior-media-production` |

`TF_VAR_environment` drives `default_tags.Environment` and the two bucket names; CI derives it from the branch (`main` → production), local runs default to `development`. The job's GitHub `environment:` uses the same expression, so environment-scoped secrets resolve per branch — not against a hard-coded name.

## Inputs from outside these roots

- Both roots read `../../env.json` (repo root, gitignored) produced from Varlock. Regenerate it after changing `.env.schema`.
- `app/next.tf` uploads `../../build.zip` and hashes it with `source_code_hash`; Terraform never builds it. Missing file = plan error, so build it first: `bun run construct`, then zip `frontend/.open-next/server-functions/default` to the repo root.
- `DB_PASSWORD` comes from `env.json`. RDS rejects `/`, `"`, `@`, and spaces, and the value must match between local `.env` and the GitHub secret — applying with a different value silently rotates the live DB password.
- Tofu never loads `.env` — Varlock is wired to the app workspaces, not here. AWS credentials come from `AWS_*` env vars or the AWS profile.
- `app/media.tf` creates `finquo-junior-media-${var.environment}` with `force_destroy = true` — a destroy wipes it. Its name is injected into the Lambda as `MEDIA_BUCKET`, and the backend falls back to `finquo-junior-media-development` when that variable is absent (local dev).

## Deploy flows

Two separate workflows, no cross-workflow `needs`:

- `deploy.yml` (`infra/app/**`, `.env.schema`, app code) on `main`: `bun run construct` → zip → `env.json` → AWS creds → `tofu init -backend-config="bucket=finquo-junior-opentofu-${TF_VAR_environment}"` → apply `infra/app`.
- `state.yml` (`infra/state/**`, `backend/migrations/**`, `backend/drizzle.config.ts`, `.env.schema`) on `main`: the same init → apply `infra/state` → `bun run db:migrate`.

Both use the same `concurrency: deploy-<ref>` group, so the two environments deploy in parallel but never overlap within an environment. GitHub does not guarantee `state` finishes before `app` when one push touches both — keep migrations expand/contract for that window.

## HCL style (mandatory)

- Tabs for indentation **and** alignment, including one tab before `=`. Spaces only after keywords and symbols: `resource "aws_s3_bucket" "media" {`, `= "value"`, `tags = {`.
- Never run `tofu fmt` or `tofu fmt -check` — it rewrites tabs to 2 spaces and fights the editor LSP. Column alignment in files is owned by the formatter-on-save and may look imperfect; leave it alone.
- AWS provider `~> 6.0`, region `ap-south-1`, S3 backend with `use_lockfile = true`.
- The backend bucket is created by hand (see `README.md`); it is not managed by these roots.

```hcl
resource "aws_s3_bucket" "media" {
	bucket	= "finquo-junior-media-${var.environment}"

	force_destroy	= true
}
```

## Conventions

- Tags only via `provider "aws" { default_tags { ... } }` in `main.tf`, never per-resource `tags`.
- One feature per file, including its `output` blocks — e.g. `media.tf` holds the bucket, MediaConvert queue, its IAM role/policy and the outputs. Don't split into `iam.tf` / `outputs.tf`.
- No `variable` blocks and no extra `data` sources unless asked; literals live in the `.tf` files. `environment` is the deliberate exception (it feeds `default_tags`).
- `main.tf` is developer-owned: don't reformat or rewrite it, add new resources in their own file.
- Migrations belong to CI. Never run `db:generate`/`db:migrate` yourself and never edit `backend/migrations/`.
- `docs/` is a git submodule; don't edit docs from this repo.
