# infra

Two independent OpenTofu roots. There is no `.tf` at this level, so always run `tofu` from inside a root.

- `app/` — Next.js Lambda from the CI-built OpenNext zip, Function URL, media S3 bucket + MediaConvert queue.
- `state/` — long-lived shared resources: RDS Postgres, its subnet group/SG, and the `/finquo/db/url` SSM parameter. Put Redis/RabbitMQ here later.

## Commands

```bash
cd infra/app        # or infra/state
tofu init
tofu validate
tofu plan -out=tfplan
tofu apply tfplan
```

- After editing a `backend` block: `tofu init -reconfigure`.
- The state bucket `finquo-app-opentofu` must exist before the first `init`.

## State

- One bucket, `use_lockfile = true`, fixed keys `app/terraform.tfstate` and `state/terraform.tfstate`. Never point two roots at the same key; locks are per key, so the roots can apply concurrently.
- `state` must be applied before `app`. `app/next.tf` reads the DB URL from the `/finquo/db/url` SSM parameter that `state/db.tf` writes — there is no `terraform_remote_state` between the roots.
- `state` is shared by every deployment in the account: `skip_final_snapshot = true` and `deletion_protection = false` mean destroy is immediate and unrecoverable.
- One deployment per AWS account: `development` and `production` each get their own bucket, state, database, and SSM parameter. `var.environment` is a **tag only** — never put it in a resource name, or the same stack in two accounts stops being identical.

## Environments

| | `development` | `production` |
|---|---|---|
| AWS account | separate | separate |
| Trigger | not wired yet — both workflows run on `main` only | push to `main` |
| State | `state/terraform.tfstate` in that account's bucket | same key, different account/bucket |

`TF_VAR_environment` comes from the branch (`main` → production) and only affects `default_tags.Environment`. Concurrency is per ref (`deploy-<ref>`).

## Inputs from outside these roots

- Both roots read `../../env.json` (repo root, gitignored) produced from Varlock. Regenerate it after changing `.env.schema`.
- `app/next.tf` uploads `../../build.zip` and hashes it with `source_code_hash`; Terraform never builds it. Missing file = plan error, so build it first: `bun run construct`, then zip `frontend/.open-next/server-functions/default` to the repo root.
- `DB_PASSWORD` comes from `env.json`. RDS rejects `/`, `"`, `@`, and spaces, and the value must match between local `.env` and the GitHub secret — applying with a different value silently rotates the live DB password.
- Tofu never loads `.env` — Varlock is wired to the app workspaces, not here. AWS credentials come from `AWS_*` env vars or the AWS profile.
- `app/media.tf` creates `finquo-media-bucket` with `force_destroy = true` — a destroy wipes it.

## Deploy flows

Two separate workflows, no cross-workflow `needs`:

- `deploy.yml` (`infra/app/**`, `.env.schema`, app code) on `main`: `bun run construct` → zip → `env.json` → AWS creds → `tofu init` → apply `infra/app`.
- `state.yml` (`infra/state/**`, `backend/migrations/**`, `backend/drizzle.config.ts`, `.env.schema`) on `main`: `env.json` → AWS creds → `tofu init` → apply `infra/state` → `bun run db:migrate` for that environment.

Both use the same `concurrency: deploy-<ref>` group, so the two environments deploy in parallel but never overlap within an environment. GitHub does not guarantee `state` finishes before `app` when one push touches both — keep migrations expand/contract for that window.

## HCL style (mandatory)

- Tabs for indentation **and** alignment, including one tab before `=`. Spaces only after keywords and symbols: `resource "aws_s3_bucket" "media" {`, `= "value"`, `tags = {`.
- Never run `tofu fmt` or `tofu fmt -check` — it rewrites tabs to 2 spaces and fights the editor LSP. Column alignment in files is owned by the formatter-on-save and may look imperfect; leave it alone.
- AWS provider `~> 6.0`, region `ap-south-1`, S3 backend with `use_lockfile = true`.
- The backend bucket is created by hand (see `README.md`); it is not managed by these roots.

```hcl
resource "aws_s3_bucket" "media" {
	bucket	= "finquo-media-bucket"

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
