# Frontend Table Development Guide

This guide establishes the architecture, conventions, and rules for building data tables in this frontend codebase. Every agent and developer must adhere strictly to these principles to maintain consistency, type safety, and clean design across all views.

---

## 1. Tech Stack

- **Framework**: Next.js (App Router, React 19)
- **Table State Management**: TanStack Table v9 (`@tanstack/react-table`)
- **Server State & Queries**: TanStack Query (`@tanstack/react-query`) with oRPC utilities (`@/hooks/api`)
- **Design System**: shadcn/ui components backed by Base UI (`@base-ui/react`) and Tailwind CSS
  - Table: `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell` from `@/components/ui/table`
  - Drawers: `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerFooter`, `DrawerClose` from `@/components/ui/drawer`
  - Item UI: `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription` from `@/components/ui/item`
  - Avatars & Badges: `@/components/ui/avatar`, `@/components/ui/badge`
- **User & Entity Resolution**: `<FetchUser />` (`@/hooks/user`), Better Auth (`@/hooks/auth`), and `<ProfileCard />` (`@/components/profile`)
- **Loading & Notifications**: `<Loader />` (`@/components/loader`), `<Spinner />` (`@/components/ui/spinner`), `sileo` as `toast`
- **URL & Search State**: `useQueryState` (`nuqs`) and `useDebounce` (`@uidotdev/usehooks`)

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

## 3. The Item + Drawer Pattern for Entity Cells

Whenever a table row references an entity (such as a Student, Teacher, or User), follow the **Item + Drawer** design pattern:

### A. The Entire `<Item>` is the Trigger
Never make only the avatar clickable or introduce a redundant "View Profile" button column. The **entire** `<Item>` must be wrapped by `<DrawerTrigger render={<Item ... />}>`:

```tsx
columnHelper.display({
  id: "student",
  header: "Student",
  cell: ({ row }) => (
    <FetchUser id={row.original.id} isPending={<Spinner />}>
      {(user) => (
        <Drawer>
          <DrawerTrigger
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

### B. Pre-Joined vs. Fetched Users
- **Pre-Joined Users**: If the query already joins `user` (e.g. `teacher.user`), read `row.original.user` directly without `<FetchUser>`.
- **Foreign Key IDs**: If the record only contains an ID (`mentorId`, `studentId`), wrap the cell with `<FetchUser id={id} isPending={<Spinner />}>`.

---

## 4. Design System & Cell Formatting Rules

### A. Primitive Text (No Redundant HTML Wrappers)
Do not wrap primitive text in unnecessary `<span>` or `<div>` tags. Return formatted strings directly from the cell accessor:
```tsx
// Good:
columnHelper.accessor("program", {
  header: "Program",
  cell: ({ getValue }) => getValue() ?? "—",
}),

// Bad (Avoid):
columnHelper.accessor("program", {
  header: "Program",
  cell: ({ getValue }) => <span>{getValue() ?? "—"}</span>,
}),
```

### B. Badges
- Use semantic badge variants:
  - `variant="success"`: Paid, active, configured, attended.
  - `variant="warning"`: Pending, rescheduled, unconfigured.
  - `variant="destructive"`: Banned, reschedule requested.
  - `variant="info"` / `default`: Scheduled, primary status.
  - `variant="secondary"` / `outline`: Inactive, secondary tags.
- **Do not pass `size="sm"` to `Badge`**: In this design system, `Badge` has a fixed height (`h-5`). Passing `size="sm"` causes TypeScript compilation errors.

### C. Buttons in Table Cells
- For action buttons (e.g. "Join" meeting or impersonation icon), use `variant="outline"` with `size="sm"` or `size="icon-sm"`.
- Never specify manual icon sizing (e.g. `className="size-4"`) inside buttons; the button manages SVG sizing automatically.
- Use `render={<a href={url} target="_blank" rel="noreferrer" />}` for external links.

### D. Dates & Times
- Date strings: `new Date(val).toLocaleDateString()`.
- Time intervals: `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`.
- Relative times: `${getRelateTime(val)} ago`.

---

## 5. TanStack Table Setup Boilerplate

Every table file should follow this exact setup:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
} from "@tanstack/react-table";
import Loader from "@/components/loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/hooks/api";

type RecordItem = NonNullable<
  Awaited<
    ReturnType<
      NonNullable<
        ReturnType<typeof api.router.procedure.queryOptions>["queryFn"]
      >
    >
  >
>[number];

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

type DataTableFeatures = typeof features;

const columnHelper = createColumnHelper<DataTableFeatures, RecordItem>();

const columns: ColumnDef<DataTableFeatures, RecordItem>[] =
  columnHelper.columns([
    // Define columns here
  ]);

export default function Page() {
  const { data: records = [], isPending } = useQuery(
    api.router.procedure.queryOptions(),
  );

  const table = useTable({
    features,
    data: records,
    columns,
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {header.isPlaceholder ? null : (
                  <table.FlexRender header={header} />
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center">
              No records found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
```

---

## 6. Search, Filter, and Action Rows

When tables include search inputs, filters, or row actions (e.g. Admin Users):

1. **Filtering UI Container**: Wrap filters in `<Frame>` and `<FramePanel className="flex flex-row gap-4">`.
2. **Debounced Search**: Use `useQueryState("q")` combined with `useDebounce(search, 500)` to prevent excessive API requests.
3. **Preserve Filter Controls on Search**: When fetching debounced results, do **not** replace the search inputs with `<Loader />`. Use:
   ```tsx
   if (isPending && !data.length) {
     return <Loader />;
   }
   ```
4. **Interactive Action Cells**: Extract interactive cells (such as role editors or impersonation buttons) into standalone subcomponents within the same file. Always invalidate queries and trigger toasts upon success:
   ```tsx
   function ChangeRoleCell({ user }: { user: UserRecord }) {
     const { mutateAsync, isPending } = useMutation(
       api.admin.promote.mutationOptions({
         onSuccess: () => {
           queryClient.invalidateQueries();
           toast.success({ title: "Role updated successfully" });
         },
       }),
     );

     return (
       <Select
         items={rolesObject}
         value={user.role ?? undefined}
         disabled={isPending}
         onValueChange={(r) => {
           if (r) mutateAsync({ id: user.id, role: r as Role });
         }}
       >
         <SelectTrigger size="sm">
           <SelectValue placeholder="Edit Role" />
         </SelectTrigger>
         <SelectContent>
           <SelectGroup>
             {rolesObject.map((item) => (
               <SelectItem key={item.value} value={item.value}>
                 {item.label}
               </SelectItem>
             ))}
           </SelectGroup>
         </SelectContent>
       </Select>
     );
   }
   ```

---

## 7. Summary Checklist Before Finalizing a Table

- [ ] Built directly in `page.tsx` with zero duplicate components in `_components/`.
- [ ] Exported only `default function Page()` (no exported `columns`, `features`, or types).
- [ ] Inferred table row types accurately from `api.<router>.<procedure>.queryOptions`.
- [ ] Used `<Loader />` for page pending state.
- [ ] Wrapped entity cells in `<Item>` and made the **entire** `<Item>` the `<DrawerTrigger>`.
- [ ] Displayed `<ProfileCard />` inside the `<DrawerContent>`.
- [ ] Used semantic `variant` on `<Badge>` without passing invalid `size` props.
- [ ] Used bare `<Icon />` inside buttons (no manual `size-4` class).
- [ ] Rendered primitive strings directly into cells without redundant wrapper elements.
- [ ] Provided an empty table state with `colSpan={columns.length}` displaying `"No [records] found"`.
- [ ] Passed TypeScript compilation check (`bun run check`) with 0 errors.
