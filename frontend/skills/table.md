# Frontend Table Development Guide

This guide establishes the architecture, conventions, and rules for building data tables in this frontend codebase. Every agent and developer must adhere strictly to these principles to maintain consistency, type safety, and clean design across all views.

---

## 1. Tech Stack

- **Framework**: Next.js (App Router, React 19)
- **Table State Management**: TanStack Table v9 (`@tanstack/react-table`)
- **Server State & Queries**: TanStack Query (`@tanstack/react-query`) with oRPC utilities (`@/hooks/api`)
- **Design System**: shadcn/ui components backed by Base UI (`@base-ui/react`) and Tailwind CSS
  - Table: `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell` from `@/components/ui/table`
  - Container: `Frame`, `FramePanel` from `@/components/reui/frame`
  - Drawers: `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerFooter`, `DrawerClose` from `@/components/ui/drawer`
  - Item UI: `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription` from `@/components/ui/item`
  - Hover Card: `HoverCard`, `HoverCardTrigger`, `HoverCardContent` from `@/components/ui/hover-card`
  - Tooltips: `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip`
  - Avatars & Badges: `@/components/ui/avatar`, `@/components/ui/badge`
- **User & Entity Resolution**: `<FetchUser />` (`@/hooks/user`), Better Auth (`@/hooks/auth`), and `<ProfileCard />` (`@/components/profile`)
- **Loading & Notifications**: `<Loader />` (`@/components/loader`), `<Spinner />` (`@/components/ui/spinner`), `sileo` as `toast`
- **URL & Search State**: `useQueryState` (`nuqs`) and `useDebounce` (`@uidotdev/usehooks`)
- **Time Utilities**: `getRelateTime` from `utils` (`import { getRelateTime } from "utils"`)

---

## 2. Core Architecture Rules

### A. Single-File Colocation & Clean Exports
- **Colocate Table Logic**: Build tables directly in `page.tsx`. Do **not** create duplicate component files in `_components/` unless explicitly required or shared across multiple distinct routes.
- **Export Only the Page**: Never export internal table variables such as `features`, `columns`, `DataTableFeatures`, or helper functions from `page.tsx`. The file must only export `default function Page()`.

### B. Full-Page vs. Inline Loading States
- **Full Page Loading**: Always use `<Loader />` from `@/components/loader` for initial page loading states (`if (isPending) return <Loader />;`).
- **Inline / Micro Loading**: Use `<Spinner />` from `@/components/ui/spinner` only for nested, asynchronous cell resolution (e.g. `<FetchUser isPending={<Spinner />}>`).

### C. Exact Type Inference from Query Options
Never manually redeclare database or response types for table rows if they can be inferred directly from the oRPC query. Use exact return type inference:

```ts
type RecordItem = NonNullable<
  Awaited<
    ReturnType<
      NonNullable<
        ReturnType<typeof api.router.procedure.queryOptions>["queryFn"]
      >
    >
  >
>[number];
```

This guarantees 100% type alignment between backend drizzle queries, oRPC routers, and table cell accessor definitions.

---

## 3. Entity & Cell Interaction Patterns

### A. The Item + Drawer Pattern for Primary Entity Cells
Whenever a table row references a primary entity (such as a Student, Teacher, or User), wrap the **entire** `<Item>` in `<DrawerTrigger render={<Item ... />}>`:

```tsx
columnHelper.display({
  id: "student",
  header: "Student",
  cell: ({ row }) => (
    <FetchUser id={row.original.id} isPending={<Spinner />}>
      {(user) => (
        <Drawer>
          <DrawerTrigger
          	nativeButton={false}
            render={
              <Item className="cursor-pointer p-0 text-left hover:opacity-80 transition-opacity" />
            }
          >
            <ItemMedia>
              <Avatar size="sm">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name}
                />
                <AvatarFallback>
                  {user.name?.[0] ?? "U"}
                </AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{user.name}</ItemTitle>
              <ItemDescription>{user.email}</ItemDescription>
            </ItemContent>
          </DrawerTrigger>
          <DrawerContent className="overflow-y-auto">
            <DrawerHeader>
              <DrawerTitle>{user.name}</DrawerTitle>
              <DrawerDescription>{user.email}</DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-4 p-4">
              <ProfileCard user={user} />
              {/* Optional sub-entity profile card */}
              <StudentProfile student={row.original} />
            </div>
            <DrawerFooter>
              <DrawerClose render={<Button variant="outline" />}>
                Close
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </FetchUser>
  ),
}),
```

### B. HoverCard for Foreign Key Relationships (`supervisorId`, `mentorId`)
For supervisor or mentor foreign keys, use `<HoverCard>` so users can hover to instantly preview who the person is:

```tsx
columnHelper.display({
  id: "supervisor",
  header: () => (
    <Tooltip>
      <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
        Supervisor
      </TooltipTrigger>
      <TooltipContent>Assigned scheduler supervisor</TooltipContent>
    </Tooltip>
  ),
  cell: ({ row }) => {
    const supervisorId = row.original.supervisorId;
    if (!supervisorId) {
      return <Badge variant="outline">Not Assigned</Badge>;
    }
    return (
      <HoverCard>
        <HoverCardTrigger
          render={
            <span
              role="button"
              className="cursor-pointer font-medium text-xs underline decoration-dotted"
            />
          }
        >
          <FetchUser id={supervisorId} isPending={<Spinner />}>
            {(supervisor) => supervisor.name}
          </FetchUser>
        </HoverCardTrigger>
        <HoverCardContent className="w-64">
          <FetchUser id={supervisorId} isPending={<Spinner />}>
            {(supervisor) => (
              <Item className="p-0 text-left">
                <ItemMedia>
                  <Avatar size="sm">
                    <AvatarImage src={supervisor.image ?? undefined} alt={supervisor.name} />
                    <AvatarFallback>{supervisor.name?.[0] ?? "S"}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{supervisor.name}</ItemTitle>
                  <ItemDescription>{supervisor.email}</ItemDescription>
                </ItemContent>
              </Item>
            )}
          </FetchUser>
        </HoverCardContent>
      </HoverCard>
    );
  },
}),
```

### C. Row Action "Edit" Drawer Button
Every table row should provide an edit action button (`<PenIcon />`) triggering an edit drawer:

```tsx
columnHelper.display({
  id: "edit",
  header: "Edit",
  cell: ({ row }) => (
    <Drawer>
      <DrawerTrigger
        render={
          <Button variant="outline" size="icon-sm">
            <PenIcon />
          </Button>
        }
      />
      <DrawerContent className="overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Edit Record</DrawerTitle>
          <DrawerDescription>Edit details</DrawerDescription>
        </DrawerHeader>
        <div className="p-4" />
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>
            Close
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}),
```

### D. Complex Sub-Entity Triggers (e.g. Teacher Availability)
When a column has complex or pending visualization logic (e.g. teacher availability schedules), render an icon action button (e.g. `<CalendarIcon />`) that opens a drawer rather than a plain badge:

```tsx
columnHelper.display({
  id: "availability",
  header: () => (
    <Tooltip>
      <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
        Availability
      </TooltipTrigger>
      <TooltipContent>Teacher's weekly schedule availability</TooltipContent>
    </Tooltip>
  ),
  cell: ({ row }) => (
    <Drawer>
      <DrawerTrigger
        render={
          <Button variant="outline" size="icon-sm">
            <CalendarIcon />
          </Button>
        }
      />
      <DrawerContent className="overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Teacher Availability</DrawerTitle>
          <DrawerDescription>Availability schedule</DrawerDescription>
        </DrawerHeader>
        <div className="p-4" />
        <DrawerFooter>
          <DrawerClose render={<Button variant="outline" />}>
            Close
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
}),
```

---

## 4. Design System & Cell Formatting Rules

### A. Column Header Tooltips
Add hover tooltips on columns that may be ambiguous or jargon-heavy (e.g. `Program`, `Schooling`, `Status`, `Meeting`, `Payment`):

```tsx
header: () => (
  <Tooltip>
    <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
      Program
    </TooltipTrigger>
    <TooltipContent>
      Enrolled curriculum or study plan
    </TooltipContent>
  </Tooltip>
),
```
*Note: Always wrap the table or page component with `<TooltipProvider>` so tooltips trigger correctly.*

### B. Frame Container Pattern
Wrap all tables in `<Frame>` and `<FramePanel className="p-0!">` to maintain consistent panel styling and border radius:

```tsx
<TooltipProvider>
  <Frame>
    <FramePanel className="p-0!">
      <Table>
        {/* Table content */}
      </Table>
    </FramePanel>
  </Frame>
</TooltipProvider>
```

### C. Link Buttons with `nativeButton={false}`
When using Base UI's `<Button>` to render an anchor tag (`render={<a href={...} />}`), **always pass `nativeButton={false}`**:

```tsx
// Correct:
<Button
  variant="outline"
  size="sm"
  nativeButton={false}
  render={<a href={link} target="_blank" rel="noreferrer" />}
>
  Join
</Button>

// Incorrect (Will trigger Base UI invalid button attribute warnings):
<Button
  variant="outline"
  size="sm"
  render={<a href={link} target="_blank" rel="noreferrer" />}
>
  Join
</Button>
```

### D. Relative Time Columns (`createdAt`, `updatedAt`)
Use `getRelateTime` from `utils` (`import { getRelateTime } from "utils"`) for time and date columns:

```tsx
columnHelper.accessor("createdAt", {
  header: "Joined",
  cell: ({ getValue }) => `${getRelateTime(new Date(getValue()))} ago`,
}),
```

### E. Badges & "Not Assigned" Fallbacks
- If an associated entity ID (`supervisorId`, `mentorId`, `teacherId`, etc.) is null or undefined, always render `<Badge variant="outline">Not Assigned</Badge>` rather than a blank space or plain dash.
- Use semantic badge variants:
  - `variant="success"`: Paid, active, attended.
  - `variant="warning"`: Pending, rescheduled.
  - `variant="destructive"`: Banned, reschedule requested.
  - `variant="info"`: Scheduled, active session.
  - `variant="secondary"` / `outline`: Standard tags, unassigned states.
- **Never pass `size="sm"` to `Badge`**: `Badge` has fixed height (`h-5`). Passing `size` causes TypeScript compilation errors.

---

## 5. Summary Checklist Before Finalizing a Table

- [ ] Built directly in `page.tsx` with zero duplicate components in `_components/`.
- [ ] Exported only `default function Page()`.
- [ ] Wrapped table in `<TooltipProvider>` and `<Frame><FramePanel className="p-0!"><Table>...</Table></FramePanel></Frame>`.
- [ ] Rendered `<Badge variant="outline">Not Assigned</Badge>` for null `supervisorId`, `mentorId`, `teacherId`, etc.
- [ ] Added `<Tooltip>` to ambiguous column headers (`Program`, `Schooling`, `Status`, etc.).
- [ ] Replaced foreign key lookups (`supervisorId`, `mentorId`) with interactive `<HoverCard>` previews.
- [ ] Passed `nativeButton={false}` to every `<Button>` rendering an anchor tag (`<a>`).
- [ ] Added an edit button (`<PenIcon />`) with `<Drawer>` to every table row.
- [ ] Formatted timestamps using `${getRelateTime(new Date(getValue()))} ago`.
- [ ] Wrapped entity cells in `<Item>` with the entire item acting as `<DrawerTrigger>`.
- [ ] Passed TypeScript compilation check (`bun run check`) with 0 errors.
