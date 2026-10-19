# Backend Agent Guide (Finquo)

Scope: the `backend/` workspace only. Monorepo-level commands, env/Varlock rules, and deploy flow are in the root `AGENTS.md`. This file covers what an agent working in `backend/` would otherwise get wrong.

Stack: Hono app (mounted at `/api`) serving an **oRPC v2 beta** router, **Better Auth 1.7.5** (admin plugin) + Drizzle adapter, **Drizzle ORM 1.0 RC** on `postgres-js`, **Zod v4**. Built with `tsdown`; runs as a Cloudflare Worker and (via `src/lambda.ts`) AWS Lambda. No test runner exists.

## Commands (run in `backend/`, or root `bun run backend <script>`)

> ### 🛑 DB commands and migrations are off-limits
>
> **Never run `db:generate`, `db:migrate`, or any Drizzle/DB CLI, and never create or edit anything under `backend/migrations/`.** The developer owns schema and migrations end-to-end (see the root `AGENTS.md` Ground rules). If a task seems to need a schema change, propose it and ask - do not generate it.

- `bun run dev` - hot Bun server on `:3000`, loads `--env-file=../.env`.
- `bun run check` - `tsc --noEmit`. This is the backend typecheck; it must pass.
- `bun run construct` - `varlock codegen && tsdown` (`build`/`compile` are identical). Emits `out/` (worker entries `index`, `lambda`) and `dist/` (package exports). **Run this after any change the frontend imports.**
- `bun run db:generate` / `db:migrate` - drizzle-kit. **Off-limits - the developer runs these.**
- `bun run auth:generate` - regenerates `src/db/auth.test.ts` from `src/services.ts`. Never edit that file by hand.
- `bun run cf:dev` - `wrangler dev`.
- Seed: `bun script/seed.ts` (drizzle-seed has no npm script).

Env: Bun auto-loading is disabled (`bunfig.toml`). `backend/.env.schema` imports the root schema (minus `NEXT_PUBLIC_*`) and generates the gitignored, `@ts-nocheck` `src/env.ts`. Run env-dependent one-offs from `backend/` or pass `--env-file=../.env`. Path alias `@/*` -> `backend/src/*` (declared only in `backend/tsconfig.json`).

## Request flow and structure

- `src/index.ts` default-exports the Hono app (logger, CORS, `/auth/*` -> Better Auth, then the oRPC handler, then `/openapi/*`). `src/lambda.ts` wraps it for Lambda.
- `src/services.ts` exports the **singletons** `db` (Drizzle) and `auth` (Better Auth). Import these from `@/services`; never build a new client.
- Router tree: `src/api/routers/index.ts` assembles `appRouter` = top-level routers (`admin`, `scheduler`, `teacher`, `student`, `common`, `sidebar`) plus nested `core.*` (`lesson`, `scheduler`, `self`, `slot`, `student`, `teacher`, `user`).
- Client-facing types: `src/api/index.ts` exports `AppRouter` / `AppRouterClient` as `backend/api`.

### Top-level routers vs `core/*` (pick the right file)

The two groups are a deliberate split, not duplicates:

- **Top-level** (`admin.ts`, `scheduler.ts`, `teacher.ts`, `student.ts`, `common.ts`, `sidebar.ts`) are **self / role-dashboard** endpoints. They use the single-role self guard (`adminProcedure`, `schedulerProcedure`, `teacherProcedure`, `studentProcedure`) or `protectedProcedure`, and act on **the caller's own record** via `context.user.id` - e.g. `student.get`, `teacher.updateAvailability`, `student.update`. Called as `api.<role>.<procedure>`.
- **`core/*`** are **entity CRUD by id**. They use `getRolesProcedure([...roles])` and scope rows per role with `MapRole(context.role, {...})` (admin = all rows, scheduler/teacher = only their assigned rows). Standard shape: `list` / `get` / `search` / `create` / `update` / `delete`. Called as `api.core.<entity>.<procedure>`.
- `student.ts`, `teacher.ts`, and `scheduler.ts` exist in **both** places and export the **same symbol name** (`studentRouter`, ...); `routers/index.ts` aliases the `core/` ones (e.g. `studentRouter as studentCore`). So when adding a procedure, decide whether the target is the caller's own data (top-level) or a record addressed by `id` (core) - do not assume one file per entity.
- Exceptions to the CRUD pattern: `core/self.ts` uses the self guards and returns `context.data` (the role record already loaded by the guard), and `common.ts` is `protectedProcedure` for any signed-in user.

## Procedures and authorization (`src/api`)

- Build every procedure from the builders in `src/api/procedure.ts`: `publicProcedure` -> `protectedProcedure` (injects `context = { session, user }`) -> a role guard.
- Role guards: `getProcedure("<role>")` and the named `adminProcedure` / `studentProcedure` / `teacherProcedure` / `qaAuditorProcedure` / `enrollmentAdvisorProcedure` / `schedulerProcedure` check one role and add the role's DB record as `context.data`; `getRolesProcedure([...roles])` allows several; `checkPermission(sector, action)` checks access-control statements.
- Roles, sectors, and actions all live in `src/auth/permissions.ts` (`ac`, `roles`, `roleEnum`, `roleEnumZod`). Add a new sector/action there instead of hardcoding strings.
- Wrap every Drizzle call in `tryAPI("<tag>", promise)` / `getAPI("<tag>", promise, fallback)`. They log and rethrow failures as `INTERNAL_SERVER_ERROR` ORPCErrors; `getAPI` requires a fallback for empty results. The `tag` string is a debugging label, keep it descriptive.
- For role-dependent query filters, use `MapRole(context.role, { admin: {...}, scheduler: {...} })` from `@/utils/role`.
- Validation errors are normalized to `INPUT_VALIDATION_FAILED` (HTTP 422) by the interceptor in `src/index.ts` - do not re-map them. Add `.meta(openapi({ method: "GET" }))` for handlers the OpenAPI spec should expose as GET.

## Database (`src/db`)

- Barrel `src/db/schema/index.ts`; relations in `src/db/schema/relations.ts` (merged with `authRelations` into `getRelations`). Prefer `db.query.<table>` with `with:` for relations.
- Zod schemas are generated from tables in `src/db/zod.ts` (`createSchemaFactory` with `coerce.date: true`). Reuse `Select*/Insert*/Update*Schema` in procedures instead of hand-writing column validators.
- Custom Drizzle columns live in `src/db/column/`: `date-range.test.ts` and `time-range.test.ts` are real column modules despite the `.test.ts` name, and `leave-range.ts` defines a `tstzrange` custom type. There is no test runner, so never "run" them.
- Postgres needs the `btree_gist` (slot no-overlap `EXCLUDE` constraint) and `pg_trgm` (fuzzy search) extensions. Helpers `enableConstraint` / `enableTrigramExtension` create them; fuzzy search uses raw `sql` `${col} % ${q}` + `similarity(...)`.
- New migrations go in `backend/migrations` via `db:generate`.

## Shared `utils` workspace package

- The internal package `utils` (`packages/utils`) has `main: src/index.ts` - it ships **raw TypeScript with no build step**. `tsdown` bundles it into backend output via `alwaysBundle: ["utils"]`, so edits are picked up on the next backend build; there is nothing to compile separately.
- Import from `"utils"`. It is shared with the frontend/browser, so keep anything you add runtime-agnostic (Workers-compatible, no Node-only APIs).
- Exports (`src/index.ts`): result helpers in `try.ts` (`trys`, `triedAsync`, `tryAsync`), time formatting in `time.ts` (`getRelateTime`, `getRangeTime`, `formatTimeString`, `mergeDateWithTimeString`, `getDurationFromInterval`, built on the `ms` canary package), and `SwitchFunc` in `switch.ts`.
- `triedAsync(promise, tag?)` returns `{ data, error, isSuccess }` and logs failures under the optional `tag`; `tryAsync` returns a `[error, data]` tuple. The backend's `tryAPI` / `getAPI` (`src/api/procedure.ts`) are built on `triedAsync`, so prefer those inside procedures rather than calling `triedAsync` directly.

## Boundaries and gotchas

- Only edit files under `backend/`. The frontend imports the built package (`backend/api`, `backend/config`, `backend/auth`, `backend/db` resolve to `dist/`, and `import ... from "backend"` to `out/`). Changes to exported types/schemas are invisible to the frontend until `bun run construct` rebuilds `dist/` - and the frontend reuses these schemas/types rather than duplicating them, so change them here.
- Keep code compatible with Cloudflare Workers + Lambda: Node built-ins (`node:*`) are allowed because the Workers run with `nodejs_compat` (root and backend `wrangler.json`) and Lambda is native Node. Keep the `postgres-js` client settings (`prepare: false`, `max: 1`).
- `src/env.ts` and `src/db/auth.test.ts` are generated - do not edit.
