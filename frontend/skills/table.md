# Frontend Table Development Guide

This guide establishes the architecture, conventions, and rules for building data tables using **Dice UI** (`@diceui/data-table`) and **TanStack Table v9** (`@tanstack/react-table`) in this frontend codebase. Every agent and developer must strictly adhere to these principles to maintain consistency, 100% type safety, and clean design across all views.

---

## 1. Tech Stack & Key Imports

- **Framework**: Next.js (App Router, React 19)
- **Table Components**: Dice UI Data Table (`@/components/data-table/*`)
  - `DataTable` (`@/components/data-table/data-table`)
  - `DataTableToolbar` (`@/components/data-table/data-table-toolbar`)
  - `DataTableColumnHeader` (`@/components/data-table/data-table-column-header`)
  - `useDataTable` hook (`@/hooks/use-data-table`)
  - `DataTableFeatures` & `dataTableFeatures` (`@/lib/data-table-features`)
- **Table State Management**: TanStack Table v9 (`@tanstack/react-table`)
  - `type ColumnDef`, `createColumnHelper`
- **Server State & Queries**: TanStack Query (`@tanstack/react-query`) with oRPC utilities (`@/hooks/api`)
- **Type Utilities**: `API_Returns` and `API_Params` from `@/lib/api` for exact router type extraction
- **Design System**: shadcn/ui components backed by Radix UI (`@radix-ui/*`) and Tailwind CSS
  - Container: `Frame`, `FrameHeader`, `FrameTitle`, `FrameDescription`, `FrameActions`, `FramePanel` from `@/components/reui/frame`
  - Drawers: `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerTitle`, `DrawerDescription`, `DrawerInner`, `DrawerFooter`, `DrawerClose` from `@/components/ui/drawer`
  - Dropdown Menus: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` from `@/components/ui/dropdown-menu`
  - Item UI: `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription` from `@/components/ui/item`
  - Hover Card: `HoverCard`, `HoverCardTrigger`, `HoverCardContent` from `@/components/ui/hover-card`
  - Tooltips: `Tooltip`, `TooltipTrigger`, `TooltipContent` from `@/components/ui/tooltip`
  - Buttons & Groups: `Button`, `ButtonGroup` from `@/components/ui/button` & `@/components/ui/button-group`
  - Copy Action: `<CopyButton />` from `@/components/copy`
  - Skeletons & Loaders: `<Skeleton />` from `@/components/ui/skeleton`, `<Spinner />` from `@/components/ui/spinner`
  - Avatars & Badges: `@/components/ui/avatar`, `@/components/ui/badge`
- **User & Entity Resolution**: `<FetchUser />` (`@/hooks/user`), Better Auth (`@/hooks/auth`), and `<ProfileCard />` (`@/components/profile`)
- **URL & Search State**: `useQueryState` (`nuqs`) and `useDebounce` (`@uidotdev/usehooks`)
- **Time Utilities**: `getRelateTime` from `utils` (`import { getRelateTime } from "utils"`)

---

## 2. Core Architectural Principles

### A. Single-File Colocation & Clean Exports
- **Colocate Table Logic**: Build tables directly in `page.tsx`. Do **not** split columns into separate `_components/columns.tsx` files unless explicitly required and shared across multiple distinct routes.
- **Static Column Definitions Outside Component**: Always define `columnHelper` and `columns` **statically outside the React component**. Do not wrap column definitions in `useMemo` inside the page component.
- **Export Only the Page**: Never export internal table variables such as `columns`, `columnHelper`, or helper functions from `page.tsx`. The file must only export `default function Page()`.

### B. Continuous Table Visibility & Loading States
- **FORBIDDEN: Full-Page `<Loader />`**: Never replace the data table with a full-page `<Loader />` (`if (isPending) return <Loader />;` is forbidden). The table, toolbar, search inputs, and headers must remain visible at all times.
- **Empty Rows Fallback**: Destructure data with default fallback `{ data = [], isPending } = useQuery(...)`.
- **Pending Spinner in FrameActions**: When `isPending` is true, render a disabled spinner button in `<FrameActions>` inside a `<ButtonGroup>` alongside action buttons:
  ```tsx
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
  ```
- **Inline Cell Skeletons**: For asynchronous cell resolution (e.g. `<FetchUser />`), pass a custom skeleton built with shadcn's `<Skeleton />` as `isPending`:
  ```tsx
  function UserCellSkeleton() {
    return (
      <Item>
        <ItemMedia>
          <Skeleton className="size-8 rounded-full" />
        </ItemMedia>
        <ItemContent>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </ItemContent>
      </Item>
    );
  }

  function UserInlineSkeleton() {
    return <Skeleton className="h-4 w-20" />;
  }
  ```

### C. 100% Typesafe Column Definitions
Never use raw column objects `{ id, accessorKey }` where `getValue()` resolves to `unknown`. Always use `createColumnHelper<DataTableFeatures, RecordType>()` and extract the row type from `API_Returns`:

```ts
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import type { API_Returns } from "@/lib/api";
import type { DataTableFeatures } from "@/lib/data-table-features";

type LessonRecord = API_Returns["core"]["lesson"]["list"][number];

const columnHelper = createColumnHelper<DataTableFeatures, LessonRecord>();

const columns: ColumnDef<DataTableFeatures, LessonRecord>[] =
  columnHelper.columns([
    columnHelper.accessor("name", {
      id: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Lesson" />
      ),
      enableColumnFilter: true,
      enableSorting: true,
      meta: {
        label: "Lesson",
        placeholder: "Search lessons...",
        variant: "text",
      },
      cell: ({ row }) => {
        const lesson = row.original;
        // ...
      },
    }),
  ]);
```

### D. Next.js Route Union Typing: Cast `as "/"`
Next.js Typed Routes rejects dynamic template literals like `` `/students/${id}` `` because it strictly checks against static route unions.
- **CORRECT**: Cast dynamic route strings with `as "/"`:
  ```tsx
  <Button variant="link" asChild>
    <Link href={`/students/${student.id}` as "/"}>
      {student.id}
    </Link>
  </Button>
  ```
- **FORBIDDEN**:
  - `as any` (breaks linter & type conventions)
  - Next.js `as={...}` prop (e.g. `href="/" as={...}` is deprecated and wrong)

---

## 3. UI Consistency & Anti-Pattern Rules

### A. Strict shadcn/ui Single Source of Truth
- **NO Arbitrary Utility Classes**: Do not add custom background colors, borders, custom padding, manual hover effects, or arbitrary gap values inside table cells or page headers.
- **NO Arbitrary `<div>` Wrappers**: Avoid nesting `<div>` inside `<div>` for spacing. Use standard primitives (`Item`, `FramePanel`, `DrawerInner`, `ButtonGroup`).

### B. Frame Primitives Structure
Always use the standardized `<Frame>` primitives. Do not inject custom classNames into `<FrameHeader>`:
```tsx
<Frame>
  <FrameHeader>
    <FrameTitle>Page Title</FrameTitle>
    <FrameDescription>Page subtitle description</FrameDescription>
    <FrameActions>
      <ButtonGroup>
        {isPending && (
          <Button variant="outline" size="icon" disabled>
            <Spinner />
          </Button>
        )}
        <Button asChild>
          <Link href="/resource/new">
            <PlusIcon />
            Add Resource
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
```

### C. Standardized Drawer Structure with `DrawerInner`
Do **not** use arbitrary `<div className="flex flex-col gap-4 p-4">` inside drawers. Use `<DrawerInner>`:
```tsx
<Drawer>
  <DrawerTrigger asChild>
    <Item className="cursor-pointer">
      {/* ... */}
    </Item>
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>{title}</DrawerTitle>
      <DrawerDescription>{description}</DrawerDescription>
    </DrawerHeader>
    <DrawerInner>
      <ProfileCard user={user} />
      <EntityProfile data={entity} />
    </DrawerInner>
    <DrawerFooter>
      <CopyButton text={() => entity.id} label="Entity ID" variant="outline" />
      <Button asChild>
        <Link href={`/entities/${entity.id}` as "/"}>
          View Full Details
        </Link>
      </Button>
      <DrawerClose asChild>
        <Button variant="outline">Close</Button>
      </DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```
- **Declarative Radix Triggers**: Never use `useState` or manual boolean state to open/close drawers. Wrap triggers directly with `<DrawerTrigger asChild>`.
- **Drawer inside DropdownMenu**: When triggering a drawer from a dropdown item, prevent menu event collision using `onSelect={(e) => e.preventDefault()}`:
  ```tsx
  <Drawer>
    <DrawerTrigger asChild>
      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <PenIcon />
        Edit Entity
      </DropdownMenuItem>
    </DrawerTrigger>
    <DrawerContent>
      {/* ... */}
    </DrawerContent>
  </Drawer>
  ```

### D. Links and Entity ID Display
- **All Links Must Use Button `variant="link" asChild`**:
  ```tsx
  <Button variant="link" asChild>
    <Link href={`/schedulers/${id}` as "/"}>{name}</Link>
  </Button>
  ```
- **For External Links**:
  ```tsx
  <Button variant="link" asChild>
    <a href={url} target="_blank" rel="noreferrer">
      Join
    </a>
  </Button>
  ```
- **CopyButton Utility**: Always use `<CopyButton text={() => id} label="..." />` from `@/components/copy`. Never re-implement clipboard copying.
- **Entity ID Cell Pattern**: Pair link and copy button neatly inside a `<ButtonGroup>`:
  ```tsx
  <ButtonGroup>
    <Button variant="link" asChild>
      <Link href={`/students/${id}` as "/"}>{id}</Link>
    </Button>
    <CopyButton
      text={() => id}
      label="Student ID"
      variant="ghost"
      size="icon-sm"
    />
  </ButtonGroup>
  ```

### E. Clean Empty Cells: Return `null`
Never render dummy dashes (`"—"` or `"-"`) when data is missing or nullable. Return `null` so the table renders a clean, uncluttered empty cell:
```tsx
// CORRECT
cell: ({ getValue }) => getValue() ?? null

// FORBIDDEN
cell: ({ getValue }) => getValue() ?? "—"
```

### F. Foreign Key Previews with HoverCard
For foreign key references (`supervisorId`, `mentorId`, `teacherId`), use `<HoverCard>`:
- If null/undefined: render `<Badge variant="outline">Not Assigned</Badge>`.
- If present: render a link button wrapping `<FetchUser isPending={<UserInlineSkeleton />}>`, and inside `<HoverCardContent className="w-64">` render `<Item>` with `<UserCellSkeleton />`.

### G. Row Action Menus (`"actions"` column)
Every table must include an `"actions"` column on the far right (`enableSorting: false`, `enableHiding: false`):
```tsx
columnHelper.display({
  id: "actions",
  header: "Actions",
  enableSorting: false,
  enableHiding: false,
  cell: ({ row }) => <RecordActions record={row.original} />,
})
```
Include:
1. Direct navigation link (`<ExternalLinkIcon />` or `<UserIcon />`) wrapped with `<Button variant="link" asChild>`.
2. Edit / Quick View Drawer wrapped with `<DrawerTrigger asChild>`.
3. Quick copy ID action via `<CopyButton />`.

---

## 4. Dice UI Table Hook Integration in `Page`

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

---

## 5. Developer & Agent Checklist

Before completing any data table, verify every item:

- [ ] **Type Safety**: Row type extracted directly from `API_Returns["router"]["procedure"][number]`.
- [ ] **Static Columns**: `columnHelper` and `columns` declared outside the React component (no `useMemo`).
- [ ] **Next.js Links**: All dynamic links cast using `as "/"` (no `as any`, no `as={...}`).
- [ ] **Link Buttons**: All links use `<Button variant="link" asChild><Link href={...}>...</Link></Button>`.
- [ ] **Copy Button**: IDs and clipboard actions reuse `<CopyButton text={() => id} label="..." />` from `@/components/copy`.
- [ ] **No Full-Page Loader**: Table is always mounted with `{ data = [], isPending } = useQuery(...)`.
- [ ] **Pending Spinner**: `<Spinner />` icon button rendered inside `<FrameActions>` `<ButtonGroup>` when `isPending` is true.
- [ ] **Skeletons**: `<FetchUser>` uses custom `<Skeleton />` loaders (`UserCellSkeleton`, `UserInlineSkeleton`) for `isPending`.
- [ ] **Drawers**: Use `<DrawerInner>` instead of arbitrary `div` wrappers; triggered purely via `<DrawerTrigger asChild>` with zero `useState`.
- [ ] **Clean Cells**: Null or empty values return `null` (never `"-"` or `"—"`).
- [ ] **Foreign Keys**: Null foreign keys render `<Badge variant="outline">Not Assigned</Badge>`; populated keys use `<HoverCard>`.
- [ ] **Frame Primitives**: Uses `<FrameTitle>`, `<FrameDescription>`, `<FrameActions>`, and `<FramePanel>` without arbitrary Tailwind class overrides.
- [ ] **Actions Column**: Row dropdown menu provides navigation, drawer edit trigger, and copy actions.
- [ ] **Clean Exports**: Only `export default function Page()` is exported.
- [ ] **Type Check**: Passed `bun run check` with **0 errors**.
