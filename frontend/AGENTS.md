# Frontend Agent Guide (Finquo)

Everything an agent needs to work in `frontend/`: architecture, API/data patterns, the mandatory design-system rules, and the form and table conventions. This file is the single source of truth; the deeper examples in `skills/ui.md`, `skills/form.md`, and `skills/table.md` are consolidated here.

## Stack

- Next.js App Router + React 19, Tailwind CSS v4, shadcn/ui primitives backed by Radix UI.
- Server state: TanStack Query v5 through oRPC utilities (`@orpc/client`, `@orpc/tanstack-query`).
- Forms: TanStack Form (`@tanstack/react-form`). Tables: TanStack Table v9 (`@tanstack/react-table`) wrapped by the local DataTable components.
- Auth: Better Auth client. UI state/URL state: Zustand, `nuqs`. Notifications: `sileo`. Animation: `motion`/`framer-motion`. PWA support is configured in `pwa.config.ts`.

## Commands

- Dev (frontend only): `bun run --filter frontend dev` from the repo root, or `bun run dev` to run frontend and backend together.
- Frontend dev server runs on port `4000`; the backend runs on `3000`. The API origin comes from `NEXT_PUBLIC_SERVER_URL`, defaulting to `http://localhost:3000` (see `src/hooks/url.ts`).
- Typecheck: `bun run --filter frontend check` (`tsc --noEmit`). It must pass with 0 errors.
- Env is provided by Varlock: schema at the repo root `.env.schema`, generated accessor at `src/env.ts`. Regenerate with `bun run env:generate` after editing the schema.
- Path aliases (from `tsconfig.json`): `@/*` -> `src/*`, and `@/sidebar/*` -> `src/app/(sidebar)/_components/*`.

## Hard boundaries

- Only write inside `frontend/`. Backend files are read-only references for API routes and Zod schemas.
- `src/components/ui/` is reserved for official shadcn primitives, installed with `bun shadcn add <component>`. Never create custom components there, and never overwrite an existing component to add a variant unless explicitly told to.
- Put feature-specific and route-private components in the nearest `_components/` folder. Put only components reused across multiple routes in `src/components/` (`ui/`, `reui/`, `loader.tsx`, `mode-toggle.tsx`, etc.).
- Reuse backend Zod schemas, types, and lookup dictionaries from `backend/config`; never redefine enums that already exist there.

## Routes and layouts

- `src/app/page.tsx` - landing page with live backend connection status.
- `(center)/` - public/auth shell: `login` (+ `login/create`), `error`, `status`, `user` (+ `user/edit`).
- `(sidebar)/` - dashboard shell with the sidebar layout. Role areas: `admin/` (`users`, `users/new`, `programs`), `scheduler/` (+ `scheduler/edit`), `teacher/` (+ `edit`, `leave`, `availability`).
- `(sidebar)/(common)/` - pages shared across roles: `students` (+ `[id]`, `[id]/lessons`), `teachers` (+ `[id]`, `[id]/students`), `schedulers` (+ `[id]`, `new`), `lessons` (+ `new`), `slots` (+ `new`, `[id]`), `calender`.
- `(student)/student` - student area. `me/` - current user profile.
- Root dashboard layout: `src/app/(sidebar)/layout.tsx`; sidebar components live in `src/app/(sidebar)/_components/`.

## API and data fetching

- `src/lib/api.ts` creates the oRPC `RPCLink` pointed at `/api` with `credentials: "include"`, and exports the `orpc` client plus the exact router types `API_Returns` and `API_Params`.
- `src/hooks/api.ts` wraps the client with `createTanstackQueryUtils`, exports `api`, the shared `queryClient` (with global `sileo` error toasts), and `refetchAPIs`.
- Queries: `useQuery(api.<router>.<procedure>.queryOptions({ input }))`.
- Mutations: pass callbacks directly into the oRPC options - `useMutation(api.<router>.<procedure>.mutationOptions({ onSuccess, onError }))`. Never write manual `mutationFn` wrappers or custom `useState` loading flags; use `isPending`.
- Cache invalidation: never call blanket `queryClient.invalidateQueries()`. Invalidate only the affected keys with `refetchAPIs([api.<router>.<procedure>.queryKey(...)])`.
- Auth and identity helpers: `useAuth()` (`@/hooks/auth`); current user `getUserData()` (`@/hooks/user`); entity resolution `<FetchUser id={...} />` (`@/hooks/user`) and `<FetchLesson id={...} />` (`@/hooks/lesson`).
- Role guards: `<RenderWhenRole role="scheduler">` / `<RenderWhenRole role={["admin", "scheduler"]}>`, `useHasRole("scheduler")`, and `RoleRender` from `@/hooks/role`.
- Toasts: `import { sileo as toast } from "sileo"` then `toast.success({ title })` / `toast.error({ title })`.
- End-to-end type safety: never manually cast backend payloads (no `data.address as Address`, no `(data.notes ?? []) as Note[]`). oRPC propagates backend Drizzle/Zod types into `data` directly.

## Design system rules (mandatory)

### 1. Radix composition: `asChild`, never render props

- Whenever a trigger, button, or primitive renders a custom element, anchor, or `Link`, pass `asChild` and nest the element directly.
- Never use render props (`render={...}`) or Base UI attributes (`nativeButton`). They do not exist in this codebase.

```tsx
<Button asChild variant="outline" size="sm">
  <Link href={`/students/${studentId}`}>
    <ArrowLeftIcon />
    Back
  </Link>
</Button>

<DrawerTrigger asChild>
  <Button variant="outline" size="sm">
    <PenIcon />
    Edit
  </Button>
</DrawerTrigger>

<DrawerClose asChild>
  <Button variant="outline">Close</Button>
</DrawerClose>

// FORBIDDEN
<Button render={<Link href="/x" />} nativeButton={false}>X</Button>
<DrawerTrigger render={<Button>Edit</Button>} />
```

### 2. Zero custom divs and Tailwind layout hacks

Never write ad-hoc layout wrappers or utility chains for spacing (`space-y-*`, manual margins), arbitrary sizing (`w-[400px]`, `min-w-*`, `max-w-*`), borders, hover effects, or typography. The design system owns layout, container queries, theming, and accessibility.

Use primitives instead:

- Cards and headers: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`. Never a manual `div className="flex justify-between items-center"` inside a header.
- Lists and rows: `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions` (`@/components/ui/item`).
- Alerts and empty states: `Alert`, `AlertTitle`, `AlertDescription` (`@/components/ui/alert`); `Empty`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription` (`@/components/ui/empty`).
- Tables and dividers: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead` (`@/components/ui/table`); `Separator` instead of border divs.
- Badges: `Badge` / `ColorBadge` with semantic variants (`default`, `secondary`, `outline`, `success`, `warning`, `destructive`, `info`).

| Anti-pattern | Correct approach |
| :--- | :--- |
| `<div className="flex flex-col gap-6 p-6">` | Render `<Card>` directly, or let the root layout set page bounds |
| `<div className="flex justify-between items-center">` in a card | Put actions inside `<CardAction>` |
| `<div className="border border-dashed p-8 rounded-lg">` | `<Alert><AlertTitle>Empty State</AlertTitle></Alert>` |
| `<div className="flex items-center gap-3 border p-3 rounded-md">` | `<Item variant="outline"><ItemMedia /><ItemContent /></Item>` |
| Arbitrary widths (`w-[400px]`, `max-w-xl`) | Let container queries and parents govern sizing |

### 3. Component interaction standards

- Drawers are built on `vaul` + Radix Dialog. `DrawerContent` auto-mounts the drag handle, placed on the opposite side of the opening edge and oriented parallel to it:
  - Right (desktop default): left edge, vertical (`absolute inset-y-0 left-0 w-4`, `!h-14 !w-1 rounded-full`), centered.
  - Left: right edge, vertical. Bottom (mobile default): top edge, horizontal (`w-full pt-3 pb-1`, `!h-1 !w-12 rounded-full`). Top: bottom edge, horizontal (`order-last w-full pb-3 pt-1`).
  - Handle styling: `bg-muted-foreground/20 hover:bg-muted-foreground/40`.
- Opening/closing must be declarative: wrap triggers with `<DrawerTrigger asChild>`; never use `useState` booleans. When a drawer is triggered from a dropdown item, prevent menu event collision with `onSelect={(e) => e.preventDefault()}`.
- Radix Tabs emit `data-state="active"` (not Base UI's `data-active`). Style active triggers with `data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs` (or the line variant), never `data-active:*`.
- Async selectors that fetch remote data (`UserSelector`, `LessonSelector`, ...) must define a minimum width on the field and trigger (`min-w-[200px] w-full`) and render `<Skeleton />` placeholders while `isPending` so they do not squish or shift.

### 4. Stop being "oversmart"

The developer has visual context; the agent does not. Do not invent arbitrary Tailwind utility chains to guess layout. Focus on data flow, state, role authorization, and clean component composition, and keep markup minimal.

### 5. Page and component architecture

- Two-tier page split. The default export guards URL params first; an unexported inner component (mounted only when the param exists) runs `useQuery` and handles loading/error, then renders a pure view. Never place a `useQuery` after an early return in the same component (Rules of Hooks).

```tsx
"use client";

function Student({ studentId }: { studentId: string }) {
  const { data, isPending, isError } = useQuery(
    api.core.student.get.queryOptions({ input: { id: studentId } }),
  );

  if (isPending) return <Loader />;

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Student Not Found</AlertTitle>
        <AlertDescription>The requested profile could not be loaded.</AlertDescription>
      </Alert>
    );
  }

  return <StudentProfile data={data} />;
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id;

  if (!studentId) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Invalid Student ID</AlertTitle>
        <AlertDescription>No student identifier was found in the URL.</AlertDescription>
      </Alert>
    );
  }

  return <Student studentId={studentId} />;
}
```

- Pure view rules for `_components/`: the child (e.g. `StudentProfile({ data })`) is pure presentation with no internal `useQuery`, loader, or error branches. Never use `export default` there (reserved for `page.tsx` and `layout.tsx`); use a single named export.
- List rendering: when using the loop index as a key, cast it (`key={i as number}`) to avoid lint/type friction.
- Next.js typed routes reject dynamic template literals. Cast dynamic app-router hrefs with `as "/"` (e.g. `` href={`/students/${id}` as "/"} ``). Never use `as any` and never the deprecated `as={...}` prop.

## Forms (TanStack Form)

- Reuse backend schemas/dictionaries from `backend/config` (for example `LanguageCodeZod`, `Languages`, `type LanguageCodes`). Type validators with `GetFormZod` from `@/lib/utils`.
- No raw HTML: use `FieldGroup`, `Field`, `FieldLabel htmlFor`, `FieldDescription`, `FieldError`. Never wrap inputs in custom `<div>`s or use native `<label>`. For checkboxes with labels use `<Field orientation="horizontal">` with `<Checkbox id=...>` and `<FieldLabel htmlFor=...>`.
- Cards: header actions go in `<CardAction>` inside `<CardHeader>`; right-align footer buttons with `<CardFooter className="justify-end">`.

```tsx
const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  language: LanguageCodeZod,
});

const form = useForm({
  defaultValues: {
    name: "",
    language: "en-IN" as LanguageCodes,
  } as z.infer<typeof formSchema>,
  validators: {
    onSubmit: formSchema as GetFormZod<typeof formSchema>,
  },
  onSubmit: async ({ value }) => {
    await mutateAsync(value);
  },
});
```

- Selects: pass the backend dictionary directly to `<Select items={Dictionary} />` and map `Object.entries(Dictionary)` for items. Set `min-w-[200px] w-full` on the trigger.
- Type alignment: schema types must match `defaultValues`. If a value can be `null`, use `z.string().nullable()`; do not append `.optional()` when `null` is expected.
- Mutations: callbacks go into `.mutationOptions({ onSuccess, onError })`; use `isPending`, no manual loading state.
- Server sync: seed `defaultValues` from `getUserData()` and call `form.reset({...})` in a `useEffect` when server data arrives.
- Array fields: use `form.Field mode="array"`, extract each item into a sibling subcomponent, and render `<Empty>` when the collection is empty. Add items with `field.pushValue`, remove with `field.removeValue`.
- Reactive buttons: drive submit/reset with `<form.Subscribe selector={(s) => [s.canSubmit, s.isDirty]}>`.
- Buttons: use bare icons (`<PlusIcon />`), never `<Icon className="size-4" />` inside a `Button`. Use `variant="destructive"` for delete/clear actions, and `<Spinner />` in submit buttons while `isPending`.
- Sanitize input on change and submit (for example `.toLowerCase()` for emails/usernames).
- Widgets whose internal UI model differs from the backend contract (file dropzones, calendars): keep UI state internal, expose primitive values, and write pure `toUIModel` / `toServerModel` converters. Never call `field.handleChange` synchronously from inside a `setState` updater; defer to a `useEffect`.

## Tables (TanStack Table v9 + local DataTable)

- Imports: `DataTable`, `DataTableToolbar`, `DataTableColumnHeader` from `@/components/data-table/*`; `useDataTable` from `@/hooks/use-data-table`; `DataTableFeatures` / `dataTableFeatures` from `@/lib/data-table-features`; `type ColumnDef, createColumnHelper` from `@tanstack/react-table`; `API_Returns` / `API_Params` from `@/lib/api`.
- Build the table directly in `page.tsx`; do not split columns into `_components/columns.tsx` unless truly shared across routes. Define `columnHelper` and `columns` statically outside the component (no `useMemo`). Export only `default function Page()`.
- Always keep the table mounted. Never `if (isPending) return <Loader />`. Destructure `{ data = [], isPending } = useQuery(...)`. Show progress with a disabled `<Spinner />` icon button inside `<FrameActions>`'s `<ButtonGroup>`, and pass custom `<Skeleton />` fallbacks into `<FetchUser isPending={...} />`.

```ts
type LessonRecord = API_Returns["core"]["lesson"]["list"][number];

const columnHelper = createColumnHelper<DataTableFeatures, LessonRecord>();

const columns: ColumnDef<DataTableFeatures, LessonRecord>[] =
  columnHelper.columns([
    columnHelper.accessor("name", {
      id: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} label="Lesson" />,
      enableColumnFilter: true,
      enableSorting: true,
      meta: { label: "Lesson", placeholder: "Search lessons...", variant: "text" },
      cell: ({ row }) => {
        const lesson = row.original;
        // ...
      },
    }),
  ]);
```

- Layout: use `<Frame>` / `<FrameHeader>` / `<FrameTitle>` / `<FrameDescription>` / `<FrameActions>` / `<FramePanel>` from `@/components/reui/frame`. Do not inject custom classNames into `<FrameHeader>`.
- Drawers: use `<DrawerInner>` instead of arbitrary flex `div`s, and trigger declaratively with `<DrawerTrigger asChild>`.
- Links: all links use `<Button variant="link" asChild>` with a `Link`/anchor nested inside. Copy actions use `<CopyButton text={() => id} label="..." />` from `@/components/copy` - never reimplement clipboard logic. Pair link and copy in a `<ButtonGroup>` for entity ID cells.
- Empty cells: return `null` for missing/nullable values; never render dummy dashes (`"-"`/`"—"`).
- Foreign keys (`supervisorId`, `mentorId`, `teacherId`): render `<Badge variant="outline">Not Assigned</Badge>` when null; otherwise wrap `<FetchUser>` in a link button with a `<HoverCard>` preview.
- Every table needs an `"actions"` column on the far right with `enableSorting: false` and `enableHiding: false`, providing a navigation link, a drawer edit/quick-view trigger, and a copy action.

```tsx
export default function Page() {
  const { data = [], isPending } = useQuery(api.core.lesson.list.queryOptions());

  const { table } = useDataTable({
    data,
    columns,
    mode: "client",
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
  });

  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Lessons</FrameTitle>
        <FrameDescription>Manage platform lessons and curriculum</FrameDescription>
        <FrameActions>
          <ButtonGroup>
            {isPending && (
              <Button variant="outline" size="icon" disabled>
                <Spinner />
              </Button>
            )}
            <Button asChild>
              <Link href="/lessons/new">
                <PlusIcon />
                Create Lesson
              </Link>
            </Button>
          </ButtonGroup>
        </FrameActions>
      </FrameHeader>
      <FramePanel>
        <DataTable table={table}>
          <DataTableToolbar table={table} />
        </DataTable>
      </FramePanel>
    </Frame>
  );
}
```

## Tips and tricks

1. Ask instead of guessing. If a requirement, name, or component detail is ambiguous, ask the developer rather than assuming; they have the visual and business context. Read only the files relevant to the task.
2. Read official online docs, never reverse-engineer bundled `node_modules` code. For shadcn, use the official component docs.
3. Invalidate narrowly with `refetchAPIs([...queryKey(...)])`; never blanket-invalidate.
4. Respect the workspace and component boundaries described above.
5. Compose shadcn primitives; do not add wrapper `<div>`s.

## Pre-finish checklists

Forms:

- [ ] Schemas, types, and dictionaries reused from `backend/config`.
- [ ] `defaultValues` typed `as z.infer<typeof schema>`; validators typed `as GetFormZod<typeof schema>`.
- [ ] Dictionaries passed to `<Select items={...}>` and mapped via `Object.entries`.
- [ ] No custom `<div>`s around fields and no native `<label>`; `Field`/`FieldLabel`/`FieldError` used.
- [ ] `<Field orientation="horizontal">` for labeled checkboxes.
- [ ] `asChild` on every Radix trigger/button composition; zero `render=`/`nativeButton`.
- [ ] Async selectors have `min-w-[200px] w-full` and `<Skeleton />` fallbacks.
- [ ] Inputs sanitized on change; no manual loading `useState`; callbacks passed to `.mutationOptions({...})`.
- [ ] `<CardAction>` used for header actions; `variant="destructive"` for destructive actions; bare icons inside buttons.
- [ ] `<Empty>` rendered for empty collections; submit/reset driven by `form.Subscribe` `[canSubmit, isDirty]`; array items extracted into a subcomponent.

Tables:

- [ ] Row type from `API_Returns["router"]["procedure"][number]`.
- [ ] `columnHelper`/`columns` static outside the component (no `useMemo`).
- [ ] Dynamic links cast `as "/"` (no `as any`, no `as={...}`).
- [ ] Links use `<Button variant="link" asChild>`; IDs use `<CopyButton />`.
- [ ] Table always mounted with `{ data = [], isPending }`; no full-page `<Loader />`; `<Spinner />` in `<FrameActions>`.
- [ ] `<FetchUser>` skeletons provided; drawers use `<DrawerInner>` and `<DrawerTrigger asChild>` with zero `useState`.
- [ ] Missing cells return `null`; null foreign keys show `<Badge variant="outline">Not Assigned</Badge>`.
- [ ] `<Frame>` primitives used without class overrides; `"actions"` column present.
- [ ] Only `export default function Page()` is exported.
- [ ] `bun run --filter frontend check` passes with 0 errors.
