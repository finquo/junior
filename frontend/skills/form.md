# Frontend Form Development Guide

This guide establishes the architecture, conventions, and rules for building forms in this frontend codebase. Every agent and developer must adhere strictly to these principles.

---

## 1. Tech Stack

- **Framework**: Next.js (App Router, React 19)
- **Form State Management**: TanStack Form (`@tanstack/react-form`)
- **Server State & Mutations**: TanStack Query (`@tanstack/react-query`) with oRPC utilities (`@/hooks/api`)
- **Schema Validation**: Zod (`zod`) via Standard Schema, reusing backend schemas directly from `backend/config`
- **Type Utilities**: `GetFormZod` from `@/lib/utils` for TanStack Form validator schema typing
- **Design System**: shadcn/ui components backed by Base UI (`@base-ui/react`) and Tailwind CSS
- **Notifications**: `sileo` as `toast` (`import { sileo as toast } from "sileo"`)
- **Data & Auth Queries**: `getUserData()` (`@/hooks/user`) and Better Auth (`@/hooks/auth`)

---

## 2. Design System Rules (Zero Custom Tailwind Hacks)

Never write custom Tailwind classes for layout spacing (`space-y-*`), arbitrary widths (`w-auto`, `min-w-*`, `max-w-*`), typography, or text colors. The design system components handle spacing, container queries, accessibility, and theming out of the box.

### A. Layout & Card Sizing
- **No Arbitrary Widths**: Never hardcode width classes on forms or cards. Let the design system layout and container queries govern element sizing naturally.
- **Use `CardAction`**: Never write manual alignment wrappers (e.g. `flex justify-between items-center`) in card headers. Place action buttons directly inside `<CardAction>` within `<CardHeader>`:
  ```tsx
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Description text.</CardDescription>
    <CardAction>
      <Button variant="outline" size="sm" onClick={handleAdd} disabled={isPending}>
        <PlusIcon />
        Add Item
      </Button>
    </CardAction>
  </CardHeader>
  ```
- **Align Footers**: Use `<CardFooter className="justify-end">` to cleanly right-align form submit and reset buttons.

### B. Pure shadcn Form Controls (No Custom Divs / Raw Labels)
- **Zero Raw HTML Tags**: Never write raw `<div>` wrappers around labels, inputs, or checkboxes, and never use native `<label>` tags. Always use shadcn form primitives:
  - `<FieldGroup>`
  - `<Field>`
  - `<FieldLabel htmlFor={field.name}>`
  - `<FieldDescription>`
  - `<FieldError>`
- **Horizontal Checkbox Fields**: When rendering checkboxes with labels, use `<Field orientation="horizontal">` with `<Checkbox id="...">` and `<FieldLabel htmlFor="...">`:
  ```tsx
  <Field orientation="horizontal">
    <Checkbox
      id="agree-terms"
      checked={field.state.value}
      onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
      disabled={isPending}
    />
    <FieldLabel htmlFor="agree-terms">I agree to the terms</FieldLabel>
  </Field>
  ```
- **Sanitize Input on Change**: Normalize values immediately in `onChange` and in `onSubmit` (e.g. `.toLowerCase()` for emails and usernames).

### C. Buttons, Triggers & Base UI (`nativeButton={false}`)
- **No Icon Sizing Inside Buttons**: The `Button` component automatically manages SVG sizes. Never write `<Icon className="size-4" />` inside a button — always use bare `<Icon />`.
- **`nativeButton={false}` Requirement**: Whenever a Base UI component renders a custom `<Button ... />` or `<Link ... />` via the `render` prop (e.g. `DrawerTrigger`, `DrawerClose`, or `Button render={<Link ... />}`), **always pass `nativeButton={false}`** to prevent Base UI DOM attribute conflicts:
  ```tsx
  <DrawerTrigger
    nativeButton={false}
    render={<Button variant="outline" size="sm" />}
  >
    Open
  </DrawerTrigger>

  <Button
    variant="outline"
    render={<Link href="/scheduler/sessions" />}
    nativeButton={false}
  >
    Cancel
  </Button>
  ```
- **Semantic Button Variants**: Use built-in variants instead of custom colors. For destructive or removal actions, use `variant="destructive"` instead of custom Tailwind classes like `text-destructive hover:bg-destructive/10`.
- **Submit Loading States**: Use `<Spinner />` inside the submit button and disable interactive elements when `isPending` is true.

### D. Grouped Controls & Empty States
- **Checkbox / Radio Groups**: Wrap collections in `<FieldSet>`, `<FieldLegend>`, and `<FieldGroup data-slot="checkbox-group">` with horizontal fields.
- **Empty States**: When an array or list has 0 items, always render shadcn's `<Empty>`, `<EmptyHeader>`, `<EmptyTitle>`, and `<EmptyDescription>` from `@/components/ui/empty` instead of custom dashed-border text blocks.

---

## 3. Architecture & Core Patterns

### A. Single Source of Truth for Schemas & Config
Always reuse backend Zod schemas, types, and lookup tables from `backend/config`:

```tsx
import { LanguageCodeZod, Languages, type LanguageCodes } from "backend/config";
import type { GetFormZod } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  language: LanguageCodeZod,
});
```

- **Reuse Existing Zod Enums**: Never redefine enums using `z.enum(Object.keys(...))` if a dedicated schema already exists in `backend/config` (e.g. use `LanguageCodeZod` directly).
- **Direct Dictionary Passing for Select**: Pass backend lookup objects directly to `<Select items={Dictionary} />` and map over `Object.entries(Dictionary)`:
  ```tsx
  const languageOptions = Object.entries(Languages);

  <Select
    items={Languages}
    value={field.state.value}
    onValueChange={(val) => {
      if (val) field.handleChange(val as LanguageCodes);
    }}
  >
    <SelectTrigger id={field.name}>
      <SelectValue placeholder="Select language" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        {languageOptions.map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </Select>
  ```
- **Type-Safe Form Setup (`GetFormZod`)**:
  - Strongly type `defaultValues` using `as z.infer<typeof formSchema>`.
  - Type `onSubmit` (or `onChange`) validators using `formSchema as GetFormZod<typeof formSchema>` from `@/lib/utils` to guarantee full StandardSchema / TanStack Form type compatibility.
  ```tsx
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
- **Strict Type Alignment**: Types in the schema must match `defaultValues` strictly. If `defaultValues` contains `null`, use `z.string().nullable()`. Do **not** append `.optional()` when `null` is expected, as that introduces `undefined` into the input type.

---

### B. oRPC TanStack Query Mutations
Pass lifecycle callbacks (`onSuccess`, `onError`) directly into the oRPC `.mutationOptions({...})` method. Never write manual `mutationFn` wrappers or custom `useState` loading flags:

```tsx
const { mutateAsync, isPending } = useMutation(
  api.resource.create.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success({ title: "Created successfully" });
    },
    onError: (error) => {
      toast.error({ title: error.message || "Failed to create resource" });
    },
  })
);
```

---

### C. Server State Synchronization
Pre-populate form `defaultValues` from query hooks (e.g. `getUserData()`) and synchronize state when server data loads:

```tsx
const { data: serverData } = getUserData();

const form = useForm({
  defaultValues: {
    title: serverData?.title ?? "",
    items: serverData?.items ?? [],
  } as z.infer<typeof formSchema>,
  validators: {
    onSubmit: formSchema as GetFormZod<typeof formSchema>,
    onChange: formSchema as GetFormZod<typeof formSchema>,
  },
  onSubmit: async ({ value }) => {
    updateRecord(value);
  },
});

useEffect(() => {
  if (serverData) {
    form.reset({
      title: serverData.title ?? "",
      items: serverData.items ?? [],
    });
  }
}, [serverData, form]);
```

---

### D. Component Decomposition for Dynamic / Array Fields
When a form renders an array of items (e.g. `form.Field mode="array"`), extract the individual item rendering into its own subcomponent inside the same file. Pass `{ index, form, isPending, onRemove }` to keep the parent component clean:

```tsx
function FormListItem({
  index,
  form,
  isPending,
  onRemove,
}: {
  index: number;
  form: any;
  isPending: boolean;
  onRemove: () => void;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Item #{index + 1}</CardTitle>
        <CardAction>
          <Button
            type="button"
            variant="destructive"
            size="icon-xs"
            onClick={onRemove}
            disabled={isPending}
          >
            <Trash2Icon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <form.Field
            name={`items[${index}].name`}
            children={(subField: any) => {
              const isInvalid = subField.state.meta.isTouched && !subField.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={subField.name}>Name</FieldLabel>
                  <Input
                    id={subField.name}
                    name={subField.name}
                    value={subField.state.value}
                    onBlur={subField.handleBlur}
                    onChange={(e) => subField.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    disabled={isPending}
                  />
                  {isInvalid && (
                    <FieldError errors={subField.state.meta.errors} />
                  )}
                </Field>
              );
            }}
          />
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
```

---

### E. Array Field Container with Empty Fallback
Combine `<Card size="sm">`, `<CardAction>`, and `<Empty>` for array lists:

```tsx
<form.Field
  name="items"
  mode="array"
  children={(field: any) => {
    const items = field.state.value ?? [];

    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>Manage your collection.</CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => field.pushValue({ name: "" })}
              disabled={isPending}
            >
              <PlusIcon />
              Add Item
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No items added</EmptyTitle>
                <EmptyDescription>Click "Add Item" to create one.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <FieldGroup>
              {items.map((_, index) => (
                <FormListItem
                  key={index}
                  index={index}
                  form={form}
                  isPending={isPending}
                  onRemove={() => field.removeValue(index)}
                />
              ))}
            </FieldGroup>
          )}
        </CardContent>
      </Card>
    );
  }}
/>
```

---

### F. Reactive Form Buttons
Always use `form.Subscribe` watching `[canSubmit, isDirty]` to control submission and reset buttons:

```tsx
<form.Subscribe
  selector={(state) => [state.canSubmit, state.isDirty]}
  children={([canSubmit, isDirty]) => (
    <CardFooter className="justify-end">
      <Button
        type="button"
        variant="outline"
        onClick={() => form.reset()}
        disabled={!isDirty || isPending}
      >
        Reset
      </Button>
      <Button
        type="submit"
        disabled={!isDirty || isPending || !canSubmit}
      >
        {isPending && <Spinner />}
        Save
      </Button>
    </CardFooter>
  )}
/>
```

---

## 4. Specialized Widgets & Pure Data Adapters

When an interactive component (e.g. file dropzones, calendar schedulers) uses an internal data model (like temporary IDs or client-only representations) that differs from the backend contract:

1. **Encapsulate UI State**: The widget manages temporary object URLs or local UI IDs internally.
2. **Expose Pure Values**: Form fields communicate using primitives (`string | null`) or pure data structures.
3. **Pure Adapter Functions**: Write pure converter functions (`toUIModel` and `toServerModel`) at the top of the file to transform between server payloads and widget state cleanly:
   ```ts
   function toUIModel(data?: ServerData | null): UIModel { ... }
   function toServerModel(ui: UIModel): ServerData { ... }
   ```
4. **Prevent Render Phase Warnings**: Never call `field.handleChange` synchronously from inside a child hook's `setState((prev) => ...)` updater. Defer notifications to a `useEffect` running during the commit phase.

---

## 5. Summary Checklist Before Finalizing Code

- [ ] Reused schemas (e.g. `LanguageCodeZod`), types, and dictionaries directly from `backend/config`.
- [ ] Used `defaultValues as z.infer<typeof schema>` and `schema as GetFormZod<typeof schema>` from `@/lib/utils`.
- [ ] Passed dictionary record directly to `<Select items={...}>` and mapped `Object.entries(...)`.
- [ ] Strictly zero custom `<div>` wrappers around labels/inputs and no raw `<label>` tags; used `<Field>`, `<FieldLabel>`, etc.
- [ ] Used `<Field orientation="horizontal">` for checkboxes with labels.
- [ ] Supplied `nativeButton={false}` on all Base UI trigger/button render prop targets (`Button render={<Link ... />}`, `DrawerTrigger`, `DrawerClose`).
- [ ] Sanitized string inputs on change (e.g. `.toLowerCase()` for emails and usernames).
- [ ] No manual `useState` for loading flags; used `useMutation`'s `isPending`.
- [ ] Passed `onSuccess` and `onError` directly into `.mutationOptions({...})`.
- [ ] Used `<CardAction>` inside `<CardHeader>` for header actions instead of custom flex/div wrappers.
- [ ] Used `variant="destructive"` on `<Button>` for deletion/clear actions instead of custom color classes.
- [ ] No explicit `size` classes on icons inside `<Button>` (e.g., bare `<PlusIcon />`, `<Trash2Icon />`).
- [ ] Used `<Empty>` component when list/array collections have 0 items.
- [ ] Buttons react to form state using `form.Subscribe` with `[canSubmit, isDirty]`.
- [ ] Extracted array item rendering into a clean standalone subcomponent.
