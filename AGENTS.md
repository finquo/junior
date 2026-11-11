# AGENTS.md

Finquo ("junior") monorepo: Bun workspaces driven by Vite+ (`vp`). Frontend is Next.js App Router; backend is Hono + oRPC + Better Auth + Drizzle/Postgres, and contains the API source that the frontend imports.

## Ground rules (read first - these override everything else)

- **Do not act oversmart.** The developer is a developer using you for speed. They know this codebase and write better code than you do. Defer to them. Do not make unilateral product, schema, architecture, or API-design decisions - and do not "helpfully" make a change self-contained, additive, or future-proof on your own initiative.
- **Always ask instead of assuming.** If a requirement is ambiguous, or a change has more than one sensible design, stop and ask before implementing - not after. There is always room for iteration; never lock in a decision the developer has not approved.
- **If the user gives tips on how to write good code, append that tip to the relevant `AGENTS.md`** - this file for general tips, or the workspace guide (`frontend/AGENTS.md`, `backend/AGENTS.md`, `packages/AGENTS.md`, `infra/AGENTS.md`) for workspace-specific ones - so it applies to every future session.

## General code style tips (accumulated from developer feedback)

- Prefer flat, repetitive code over clever abstractions: "just copy it" beats shared hooks/helpers. No premature extraction.
- Never duplicate a backend Zod schema, type, or lookup dictionary on the frontend; import it from `backend/config` / `backend/db` / `utils` as the single source of truth.
- Read official online docs instead of reverse-engineering bundled `node_modules` code.
- Stay inside the workspace you are editing; treat other workspaces as read-only references.
- Give small URL/helpers an optional path parameter instead of templating paths at each call site (e.g. `appOrigin(req.url, "/call/" + id)`).

## Agent guides

This root guide covers monorepo-wide rules. Each workspace also has its own guide that goes much deeper on that workspace; read the one for wherever you are editing, and keep your edits inside that workspace.

- `backend/AGENTS.md` - backend workspace only: the Hono + oRPC v2 + Better Auth + Drizzle stack, backend commands (including DB/migration rules), request flow and router tree (top-level role routers vs nested `core.*`), procedure builders and authorization, Drizzle schema/Zod conventions, and backend boundaries.
- `frontend/AGENTS.md` - frontend workspace only: Next.js App Router architecture, oRPC/TanStack Query data patterns, route/layout and component layout, frontend code style tips, the mandatory design-system rules, and the form and table conventions.
- `packages/AGENTS.md` - shared workspace packages (`utils`, `example`): raw-TypeScript exports, runtime constraints, and how consumers import them.
- `infra/AGENTS.md` - the OpenTofu roots (`app`, `state`), environments, deploy flows, and HCL conventions.

Workspace guides refine this root guide; where they are more specific, follow the workspace guide. The deeper frontend references live in `frontend/skills/{ui,form,table}.md`.

## Commands

Run from the repo root unless noted.

- `bun install`
- `bun run dev` - all workspaces in parallel (frontend `:4000`, backend `:3000`)
- `bun run frontend dev` / `bun run backend dev` - one workspace (`vp run --filter <workspace> <script>`)
- `bun run check` - typecheck every workspace (`tsc --noEmit`). This is the typecheck; there is no `check-types` script.
- `bun run biome` - Biome lint/format check (config `biome.json`: tabs, double quotes)
- `bun run build` / `compile` / `construct` - build all workspaces. `construct` is the production build that CI deploys.
- `bun run env:generate` - regenerate Varlock `env.ts` after editing `.env.schema`
- `bun run hooks:setup` - install git hooks (`vp config`; staged files run `vp check --fix`)

`vp` is the vite-plus CLI; the root scripts are thin `vp run` wrappers. There is no test runner configured and no lint/typecheck/test ordering to preserve. Backend-only commands live in `backend/AGENTS.md`.

## Environment (Varlock)

- Bun auto env loading is disabled (`bunfig.toml`); Varlock is the source of truth. Schema: root `.env.schema`. Values live in the gitignored root `.env`. Each app declares `varlock.loadPath: ["./", "../"]`.
- Run env-dependent one-off tools from the owning app directory, or pass `--env-file=../.env` (see backend `dev`).
- `bun run env:generate` only writes TypeScript; it does not load env for a later command.

## Layout and boundaries

- `backend/src/api/routers/index.ts` assembles the oRPC `appRouter` (top-level role routers plus nested `core.*`). Client types: `backend/api` -> `AppRouter`, `AppRouterClient`.
- Frontend consumes backend source through the `backend` workspace package (`backend/config`, `backend/api`); Next transpiles it via `transpilePackages`. Reuse backend Zod schemas and dictionaries instead of duplicating them.
- `packages/utils` (workspace name `utils`) and `packages/example` are shared workspaces; see `packages/AGENTS.md`.
- `docs/` is a git submodule (separate repo). Do not commit doc edits here, and treat its content as possibly stale relative to the code.

## Architecture and deploy

- Combined Worker: root `wrangler.json` runs `frontend/server.ts`, which forwards `/api/*` to `backend` and everything else to the OpenNext worker. In dev the two run as separate servers.
- Standalone backend Worker: `backend/wrangler.json` (`src/index.ts`). Next can also embed the backend at `/api` via `frontend/src/app/api/[[...route]]/route.ts`.
- CI: `deploy.yml` runs `bun install` -> `bun run construct` -> zip -> `env.json` -> `tofu apply` in `infra/app`; `state.yml` separately applies `infra/state` then runs `db:migrate`. Both share the `deploy-<ref>` concurrency group.

## Gotchas

- There is no test runner configured anywhere; there is no test command. Some `*.test.ts` files in the backend are real Drizzle column modules or generated files, not tests - see `backend/AGENTS.md`.
- Files marked as generated (`src/env.ts`, `src/db/auth.test.ts`, other codegen output) are owned by their generators - do not edit them by hand.
- `docs/` is a git submodule; its content may be stale relative to the code.
