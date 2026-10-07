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

## 1. Native Button Rule (`nativeButton`)

Base UI and shadcn `<Button>` (and button-backed primitives like `DrawerTrigger`, `DialogTrigger`) default to rendering a `<button>` DOM element.

### The Rule
- **When rendering an anchor tag (`<a>` or `<Link />`)**:
  Always pass `nativeButton={false}`.
- **When rendering a button element (`<button>` or `<Button />`)**:
  Never pass `nativeButton`.

### Examples
```tsx
// ✅ CORRECT: Button as a Link (anchor tag)
<Button
  variant="outline"
  size="sm"
  nativeButton={false}
  render={<Link href={`/students/${studentId}`} />}
>
  <ArrowLeftIcon />
  Back
</Button>

// ✅ CORRECT: External anchor link
<Button
  variant="outline"
  size="sm"
  nativeButton={false}
  render={<a href={meetingUrl} target="_blank" rel="noreferrer" />}
>
  Join Meeting
</Button>

// ✅ CORRECT: Trigger rendering a Button component (NO nativeButton)
<DrawerTrigger
  render={
    <Button variant="outline" size="sm">
      <PenIcon />
      Edit
    </Button>
  }
/>

// ❌ WRONG: Passing nativeButton={false} when the rendered element IS a button
<DrawerTrigger
  nativeButton={false} // DO NOT DO THIS
  render={
    <Button variant="outline" size="sm">
      <PenIcon />
    </Button>
  }
/>

// ❌ WRONG: Missing nativeButton={false} on an anchor/Link
<Button
  render={<Link href="/scheduler/lessons" />} // Missing nativeButton={false}!
>
  Lessons
</Button>
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

## 3. Stop Being "Oversmart"

- **The Developer Has Visual Context; AI Does Not**:
  Developers visually inspect and fine-tune UI layouts. Do not invent arbitrary Tailwind utility chains (`h-full grow min-h-20 aspect-video rounded-xl bg-muted/50`, etc.) to "guess" visual layout.
- **Focus on UI Rendering Logic**:
  Your job is data flow, state management, role authorization, and clean component composition.
- **Do Not Over-Engineer Markup**:
  Every additional unneeded `div` wrapper breaks accessibility trees, container queries, and CSS variable inheritance. Stick strictly to established design system components.

---

## 4. Directory Architecture: `components/` vs. `_components/`

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
  - `index.ts`: Barrel export for the private components.

### Pure View Rules for `_components/`:
1. **Pure View Responsibility**: The child component in `_components/` (e.g. `StudentProfile({ data })`) must be a pure presentation component. It should receive `data` and render without internal `useQuery`, loader branches, or error screens.
2. **No Default Exports**: Never use `export default` in `_components/` files. Use explicit named exports (e.g. `export function StudentProfile`). Default exports are strictly reserved for `page.tsx` and `layout.tsx`.
3. **Single Export**: Export only the view component itself. Do not export extra types or secondary helpers from the view file.

---

## 5. Page Architecture & React Hook Rules

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

## 6. End-to-End Type Safety & Zero Manual Casting

- **Never Cast Backend Types Manually**:
  Do **not** use manual type assertions like `data.address as Address` or `(data.notes ?? []) as Note[]`.
- **oRPC Inferrence**:
  oRPC automatically propagates backend Drizzle/Zod schemas directly into the client query's `data`. The returned payload is already 100% type-safe. Let TypeScript infer `data.address` and `data.notes` naturally.

---

## 7. List Rendering & Key Casting (`i as number`)

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

## 8. Custom Hooks & Role Guards

Keep authorization and logic modular with dedicated hooks:

### A. Role-Based UI Rendering (`RenderWhenRole` / `useHasRole`)
Located in `@/hooks/role`:

```tsx
import { RenderWhenRole, useHasRole } from "@/hooks/role";

// Component-based guard (renders only if current user has the role)
<RenderWhenRole role="scheduler">
  <Drawer>
    <DrawerTrigger render={<Button variant="outline" size="sm" />}>
      <PenIcon />
      Edit Student
    </DrawerTrigger>
    ...
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
- **Notifications**: `import { sileo as toast } from "sileo";`
