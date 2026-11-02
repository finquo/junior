# Packages Agent Guide (Finquo)

Scope: the shared workspace packages under `packages/` (`utils`, `example`). Monorepo-level commands, env/Varlock rules, and deploy flow are in the root `AGENTS.md`. This file covers what an agent working in `packages/` (or importing from `utils`) would otherwise get wrong.

- `packages/utils` (workspace name `utils`) has `main: src/index.ts` - it ships **raw TypeScript with no build step**. Import from `"utils"`.
- Keep everything runtime-agnostic: it is shared with the browser, Cloudflare Workers, and Lambda, so no Node-only APIs.
- Consumers bundle it at build time; the backend's `tsdown` config uses `alwaysBundle: ["utils"]`, so edits are picked up on the next backend build and there is nothing to compile separately.
- `packages/example` is boilerplate; do not copy it into real code.

## Exports (`src/index.ts`)

- Result helpers in `try.ts`: `trys`, `triedAsync`, `tryAsync`.
  - `triedAsync(promise, tag?)` returns `{ data, error, isSuccess }` and logs failures under the optional `tag`.
  - `tryAsync` returns a `[error, data]` tuple.
- Time formatting in `time.ts`: `getRelateTime`, `getRangeTime`, `formatTimeString`, `mergeDateWithTimeString`, `getDurationFromInterval` (built on the `ms` canary package).
- `SwitchFunc` in `switch.ts`.
- Shared data and dictionaries imported by the frontend (`Currencies`, `Countries`, `CurrencyZod`, ...). When UI and API need the same list, export it here instead of duplicating it in a page or component.

## Consumer notes

- Prefer the backend's `tryAPI` / `getAPI` (`backend/src/api/procedure.ts`) inside procedures rather than calling `triedAsync` directly; see `backend/AGENTS.md`.
- The frontend imports `utils` rather than hardcoding lookup dictionaries; see `frontend/AGENTS.md`.
