# Frontend UI & Architecture Guide

This guide establishes the non-negotiable frontend conventions, architectural boundaries, and design system rules for this codebase. Every agent and developer must follow these guidelines strictly.

---

## Related Specialized Guides

Depending on the specific user request, you **MUST** read the corresponding specialized guide before writing or editing code:

1. **Building or modifying Forms** ➔ Read [`skills/form.md`](./form.md)
   - Covers TanStack Form (`@tanstack/react-form`), reusing backend Zod schemas (`backend/config`), `GetFormZod`, field groups, button groups, and mutation submit lifecycles.
2. **Building or modifying Data Tables** ➔ Read [`skills/table.md`](./table.md)
   - Covers TanStack Table v9 (`@tanstack/react-table`), `<Frame>`, `<FrameHeader>`, `<FramePanel>`, exact type inference using `API_Returns` from `@/lib/api`, pagination, sorting, filters, and column definitions.

---

## Tips & Tricks for Developers & Agents

These essential rules of thumb will keep your work fast, consistent, and cleanly integrated with the codebase:

### 1. Collaboration: Ask Questions Instead of Guessing
- **Never guess**: If a requirement, naming convention, or component detail is open-ended or ambiguous, ask directly rather than assuming.
- **Lean on the developer**: The developer has full visual and business context and can immediately point you to the right direction.
- **Targeted file reading**: Do not waste time wandering through irrelevant files. Ask the developer which files are important for the task.

### 2. Read Official Docs, Never Bundled npm Packages
- **Never inspect bundled/minified package files in `node_modules`**: Reverse-engineering `.bun/` or `node_modules` is slow and error-prone.
- **Read official online docs directly**: Use official markdown docs (such as [shadcn documentation](https://ui.shadcn.com/docs/components/)) for clean APIs, supported props, and standard patterns.

### 3. Targeted Cache Invalidation with `refetchAPIs`
- **Never call blanket `queryClient.invalidateQueries()`**: Invalidate queries indiscriminately triggers cascading network requests across unrelated features.
- **Always use `refetchAPIs`**: In mutation `onSuccess` handlers, pass the specific query keys to `refetchAPIs([api.<router>.<procedure>.queryKey(...)])` to refresh only the affected data.

### 4. Strict Workspace & Component Boundaries
- **Strict Frontend Boundary**: Only write inside `frontend/`. Backend files are read-only references for API routes and Zod schemas.
- **`src/components/ui/` is Reserved**: Never create custom components in `src/components/ui/`. That directory is exclusively for official shadcn UI primitives installed via `bun shadcn add <component>`.
- **Colocate in Nearest `_components/`**: Place feature-specific and route-private components in the nearest `_components/` folder where they are consumed.
- **Preserve Existing Components**: When asked to add a new component variant, never remove or overwrite the existing component unless explicitly instructed.

### 5. Zero Custom Divs & Maximum Shadcn Primitives
- **Never wrap with unnecessary `div`s**: Redundant wrappers break flex layouts, container queries, and accessibility trees.
- **Compose with shadcn primitives**: Maximize existing UI components (`Item`, `Card`, `Badge`, `Alert`, etc.) instead of crafting ad-hoc flexbox utility chains.

---

## 1. Radix Composition Rule (`asChild` vs. Render Props)

This codebase uses **Radix UI** primitives and `@radix-ui/react-slot`. Render props (`render={...}`) and Base UI DOM attributes (`nativeButton`) are strictly forbidden and eliminated.

### The Rule
- **Whenever a trigger, button, or primitive renders a custom element, anchor, or component**:
  Pass `asChild` and nest the element directly inside.
- **Never pass `render={...}` or `nativeButton`**:
  Base UI attributes do not exist in this codebase.

### Examples
```tsx
// ✅ CORRECT: Button as a Next.js Link
<Button asChild variant="outline" size="sm">
  <Link href={`/students/${studentId}`}>
    <ArrowLeftIcon />
    Back
  </Link>
</Button>

// ✅ CORRECT: Button as an external anchor
<Button asChild variant="outline" size="sm">
  <a href={meetingUrl} target="_blank" rel="noreferrer">
    Join Meeting
  </a>
</Button>

// ✅ CORRECT: Trigger rendering a Button
<DrawerTrigger asChild>
  <Button variant="outline" size="sm">
    <PenIcon />
    Edit
  </Button>
</DrawerTrigger>

// ✅ CORRECT: DrawerClose rendering a Button
<DrawerFooter>
  <DrawerClose asChild>
    <Button variant="outline">Close</Button>
  </DrawerClose>
</DrawerFooter>

// ✅ CORRECT: HoverCard or Tooltip trigger wrapping custom inline trigger
<HoverCardTrigger asChild>
  <span role="button" className="cursor-pointer text-xs underline decoration-dotted">
    {userName}
  </span>
</HoverCardTrigger>

// ❌ WRONG: Using Base UI render props (DO NOT DO THIS)
<Button
  render={<Link href="/scheduler/lessons" />} // FORBIDDEN: Use asChild
  nativeButton={false} // FORBIDDEN: Does not exist
>
  Lessons
</Button>

// ❌ WRONG: Trigger with render prop
<DrawerTrigger
  render={<Button variant="outline">Edit</Button>} // FORBIDDEN: Use asChild
/>
```

---

## 2. Zero Custom Div & Tailwind Hacks

Never write custom Tailwind classes for layout spacing (`space-y-*`, manual margins), arbitrary sizing (`w-auto`, `min-w-*`, `max-w-*`), or ad-hoc wrapper `div`s.

The design system handles accessibility, CSS variables, container queries, and layouts out of the box.

### A. Use Dedicated Shadcn Primitives
- **Cards & Headers**:
  - Use `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, and `<CardAction>`.
  - **Never** write manual flex wrappers (`<div className="flex justify-between items-center">`) inside headers. Place action buttons directly inside `<CardAction>`.
- **List & Collection Items**:
  - Always use `<Item>`, `<ItemMedia>`, `<ItemContent>`, `<ItemTitle>`, `<ItemDescription>`, and `<ItemActions>` from `@/components/ui/item`.
  - Do not create arbitrary flexbox `div` rows with custom padding, borders, or text utility classes.
- **Alerts & Empty States**:
  - Always use `<Alert>`, `<AlertTitle>`, `<AlertDescription>` from `@/components/ui/alert`.
  - Never build custom `border-dashed` empty placeholder boxes with custom icons and paragraphs.
- **Data Tables & Details**:
  - Use `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableCell>`, `<TableHead>` from `@/components/ui/table`.
  - Use `<Separator />` for section dividers instead of manual border divs or custom margins.
- **Badges**:
  - Use `<Badge>` or `<ColorBadge>` with semantic variants (`default`, `secondary`, `outline`, `success`, `warning`, `destructive`, `info`).

### B. Summary of Forbidden Patterns
| Anti-Pattern | Correct Design System Approach |
| :--- | :--- |
| `<div className="flex flex-col gap-6 p-6">` | Render `<Card>` directly or let root layout handle page bounds. |
| `<div className="flex justify-between items-center">` in Card | Place actions directly inside `<CardAction>`. |
| `<div className="border border-dashed p-8 rounded-lg ...">` | `<Alert><AlertTitle>Empty State</AlertTitle></Alert>` |
| `<div className="flex items-center gap-3 border p-3 rounded-md">` | `<Item variant="outline"><ItemMedia /><ItemContent /></Item>` |
| Arbitrary width classes (`w-[400px]`, `max-w-xl`) | Let container queries and parent containers govern sizing. |

---

## 3. Component Interaction & State Standards

### A. Drawer Architecture & Drag Handle Placement
- Built on `vaul` with Radix Dialog primitives.
- `<DrawerContent>` automatically mounts `<DrawerHandle />` (or `<DrawerSwipeHandle />`).
- **Drag Handle Placement**:
  - The handle is placed on the **opposite side of the drawer's opening edge** and oriented **parallel** to that opening edge.
  - **Right Drawer** (Desktop default): Handle sits on the **left edge** (`absolute inset-y-0 left-0 w-4`), oriented **vertically** (`!h-14 !w-1 rounded-full`), centered vertically.
  - **Left Drawer**: Handle sits on the **right edge** (`absolute inset-y-0 right-0 w-4`), oriented **vertically** (`!h-14 !w-1 rounded-full`), centered vertically.
  - **Bottom Drawer** (Mobile default): Handle sits on the **top edge** (`w-full pt-3 pb-1`), oriented **horizontally** (`!h-1 !w-12 rounded-full`), centered horizontally.
  - **Top Drawer**: Handle sits on the **bottom edge** (`order-last w-full pb-3 pt-1`), oriented **horizontally** (`!h-1 !w-12 rounded-full`), centered horizontally.
  - Handle styling uses subtle opacity (`bg-muted-foreground/20 hover:bg-muted-foreground/40`).

### B. Radix Tabs Trigger State Styling
- Radix Tabs triggers emit `data-state="active"` (instead of Base UI's `data-active`).
- Always style active tab triggers with `data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs` (or the line variant counterpart), never `data-active:*`.

### C. Async Selectors & Fallback UI
- Entity selectors fetching async data (e.g. `UserSelector`, `LessonSelector`) must have:
  - Minimum width defined on the field and trigger (`min-w-[200px] w-full`) to prevent layout squishing.
  - Clear `<Skeleton className="..." />` placeholders during `isPending` state so the trigger does not flicker or shift.

---

## 4. Stop Being "Oversmart"

- **The Developer Has Visual Context; AI Does Not**:
  Developers visually inspect and fine-tune UI layouts. Do not invent arbitrary Tailwind utility chains (`h-full grow min-h-20 aspect-video rounded-xl bg-muted/50`, etc.) to "guess" visual layout.
- **Focus on UI Rendering Logic**:
  Your job is data flow, state management, role authorization, and clean component composition.
- **Do Not Over-Engineer Markup**:
  Every additional unneeded `div` wrapper breaks accessibility trees, container queries, and CSS variable inheritance. Stick strictly to established design system components.

---

## 5. Directory Architecture: `components/` vs. `_components/`

Keep a strict boundary between globally shared components and route-specific child components:

### `src/components/` (Globally Reusable Components)
- **Only** place components here that are reused across multiple distinct features or routes.
- Examples: `ui/` primitives, `reui/` complex patterns, `loader.tsx`, `mode-toggle.tsx`, `nav-main.tsx`.
- **Never** dump one-off page components, route views, or domain-specific drawers here.

### `src/app/.../_components/` (Route-Private Child Components)
- Place components that are private to a specific route branch inside that folder's `_components/` directory (e.g. `src/app/(sidebar)/students/_components/`).
- Colocate feature logic:
  - `profile.tsx`: Pure view component.
  - `lessons.tsx`: Route-specific management component.
  - `selector.tsx`: Domain selectors (single and multi).
  - `index.ts`: Barrel export for the private components.

### Pure View Rules for `_components/`:
1. **Pure View Responsibility**: The child component in `_components/` (e.g. `StudentProfile({ data })`) must be a pure presentation component. It should receive `data` and render without internal `useQuery`, loader branches, or error screens.
2. **No Default Exports**: Never use `export default` in `_components/` files. Use explicit named exports (e.g. `export function StudentProfile`). Default exports are strictly reserved for `page.tsx` and `layout.tsx`.
3. **Single Export**: Export only the view component itself. Do not export extra types or secondary helpers from the view file.

---

## 6. Page Architecture & React Hook Rules

### React Rule of Hooks: No Conditional Hook Execution
Never place a `useQuery` call after an early `if (!id) return ...` check in the same component. That violates React's Rules of Hooks.

### The Correct Pattern: Two-Tier Component Split
In `page.tsx`:
1. The **`export default function Page()`** guards the URL parameter existence (`studentId`). If missing, it immediately returns an `<Alert>`.
2. An **unexported internal function component** (e.g. `function Student({ studentId })`) is mounted only when `studentId` exists. It executes `useQuery`, handles `<Loader />` and error `<Alert>`, and renders the pure view component `<StudentProfile data={data} />`.

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Loader from "@/components/loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/hooks/api";
import { StudentProfile } from "../_components/profile";

// 1. Internal unexported component: runs queries & handles loader/error states
function Student({ studentId }: { studentId: string }) {
  const { data, isPending, isError } = useQuery(
    api.core.student.get.queryOptions({
      input: { id: studentId },
    }),
  );

  if (isPending) {
    return <Loader />;
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Student Not Found</AlertTitle>
        <AlertDescription>
          The requested student profile could not be loaded or does not exist.
        </AlertDescription>
      </Alert>
    );
  }

  // 2. Passes typed data directly to the pure view
  return <StudentProfile data={data} />;
}

// 3. Default Page export: guards param existence first
export default function Page() {
  const params = useParams<{ id: string }>();
  const studentId = params?.id;

  if (!studentId) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Invalid Student ID</AlertTitle>
        <AlertDescription>
          No student identifier was found in the URL.
        </AlertDescription>
      </Alert>
    );
  }

  return <Student studentId={studentId} />;
}
```

---

## 7. End-to-End Type Safety & Zero Manual Casting

- **Never Cast Backend Types Manually**:
  Do **not** use manual type assertions like `data.address as Address` or `(data.notes ?? []) as Note[]`.
- **oRPC Inferrence**:
  oRPC automatically propagates backend Drizzle/Zod schemas directly into the client query's `data`. The returned payload is already 100% type-safe. Let TypeScript infer `data.address` and `data.notes` naturally.

---

## 8. List Rendering & Key Casting (`i as number`)

When rendering lists of mapped elements using the loop index as a key (e.g., in tables or list sections), always explicitly cast the index as a number:

```tsx
// ✅ CORRECT: Explicit index casting
<TableBody>
  {notes.map((note, i) => (
    <TableRow key={i as number}>
      <TableCell>{note.text}</TableCell>
      <TableCell>{note.writterBy}</TableCell>
      <TableCell>{formatDate(note.createdAt)}</TableCell>
    </TableRow>
  ))}
</TableBody>

// ❌ AVOID: Uncast key index causing lint or type friction
<TableRow key={i}>
```

---

## 9. Custom Hooks & Role Guards

Keep authorization and logic modular with dedicated hooks:

### A. Role-Based UI Rendering (`RenderWhenRole` / `useHasRole`)
Located in `@/hooks/role`:

```tsx
import { RenderWhenRole, useHasRole } from "@/hooks/role";

// Component-based guard (renders only if current user has the role)
<RenderWhenRole role="scheduler">
  <Drawer>
    <DrawerTrigger asChild>
      <Button variant="outline" size="sm">
        <PenIcon />
        Edit Student
      </Button>
    </DrawerTrigger>
    {/* ... */}
  </Drawer>
</RenderWhenRole>

// Multi-role support
<RenderWhenRole role={["admin", "scheduler"]}>
  <AdminOnlyActions />
</RenderWhenRole>

// Hook-based check
const isScheduler = useHasRole("scheduler");
```

### B. Standard Hook Stack
- **Authentication**: `useAuth()` (`@/hooks/auth`)
- **Current User Profile**: `getUserData()` (`@/hooks/user`)
- **Entity Resolution**: `<FetchUser id={userId} />` (`@/hooks/user`), `<FetchLesson id={lessonId} />` (`@/hooks/lesson`)
- **API Queries & Mutations**: `api.<router>.<procedure>.queryOptions()` / `.mutationOptions()` with TanStack Query (`@/hooks/api`)
- **Cache Invalidation**: `refetchAPIs([api.<router>.<procedure>.queryKey(...)])` (`@/hooks/api`)
- **Notifications**: `import { sileo as toast } from "sileo";`
