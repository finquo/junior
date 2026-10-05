# Frontend Form Development Guide

This guide establishes the architecture, conventions, and rules for building forms in this frontend codebase. Every agent building or modifying forms must adhere strictly to these principles.

---

## 1. Tech Stack

- Framework: Next.js (App Router, React 19)
- Form State Management: TanStack Form (`@tanstack/react-form`)
- Server State & Mutations: TanStack Query (`@tanstack/react-query`)
- Schema Validation: Zod (`zod`) via Standard Schema
- Design System: shadcn/ui components backed by Base UI (`@base-ui/react`) and Tailwind CSS
- Notifications: `sileo` as `toast` (`import { sileo as toast } from "sileo"`)
- Authentication: Better Auth client (`import { authClient, useAuth } from "@/hooks/auth"`)

---

## 2. Core Form Components

Never write custom Tailwind utility classes for layout spacing (`space-y-*`), font sizes, or text colors in form fields. The design system provides components that automatically handle spacing, responsive container queries, accessibility, and theming.

Import from `@/components/ui/field`:
- `<FieldGroup>`: Container that manages gap spacing and responsive layout across fields.
- `<Field data-invalid={isInvalid}>`: Wrapper for an individual form control.
- `<FieldLabel htmlFor={field.name}>`: Semantic label linked to input.
- `<FieldDescription>`: Helper text beneath the control.
- `<FieldError errors={field.state.meta.errors}>`: Displays Zod validation errors.
- `<FieldSeparator>`: Clean divider between logical form sections.

Import from `@/components/ui/card`:
- `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>`.

Import from `@/components/ui/button` & `@/components/ui/spinner`:
- `<Button variant="default | outline | destructive" />`
- `<Spinner />` (displays during pending/saving states)

---

## 3. Architecture & Pattern

### A. Schema Definition
Keep schemas clean and concise. Types in the schema must match `defaultValues` strictly:

```tsx
import { z } from "zod";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
  avatar: z.string().nullable(), // Notice: .nullable() without .optional() when default is null
});
```

> Crucial Type Rule: If `defaultValues` has a field typed as `string | null`, the Zod schema MUST be `z.string().nullable()`. Do NOT append `.optional()` because that introduces `undefined` into the input type, causing a TypeScript `TS2322` StandardSchema type mismatch with TanStack Form.

---

### B. TanStack Query Mutation
Delegate all API calls, network state, and pending flags to `useMutation`. Never declare custom `useState` for loading or saving flags (e.g. `const [isSaving, setIsSaving] = useState(false)`).

```tsx
const { mutate: updateProfile, isPending: isSaving } = useMutation({
  mutationKey: ["update-profile"],
  mutationFn: async (values: { name: string; avatar: string | null }) => {
    const { data, error } = await authClient.updateUser({
      name: values.name.trim(),
      image: values.avatar,
    });
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    toast.success({ title: "Updated successfully" });
  },
  onError: (error) => {
    toast.error({ title: error.message || "Something went wrong" });
  },
});
```

---

### C. TanStack Form Setup
Initialize `useForm` with Standard Schema validation:

```tsx
const form = useForm({
  defaultValues: {
    name: data?.name ?? "",
    avatar: (data?.image ?? null) as string | null,
  },
  validators: {
    onSubmit: formSchema,
    onChange: formSchema,
  },
  onSubmit: async ({ value }) => {
    updateProfile(value);
  },
});

// Keep form state in sync when server data arrives
useEffect(() => {
  if (data) {
    form.reset({
      name: data.name ?? "",
      avatar: data.image ?? null,
    });
  }
}, [data, form]);
```

---

### D. Field Binding with Accessible Markup
Follow the shadcn TanStack Form render-prop pattern:

```tsx
<form
  onSubmit={(e) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  }}
>
  <CardContent>
    <FieldGroup>
      <form.Field
        name="name"
        children={(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Name</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Your name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                disabled={isSaving}
              />
              {isInvalid && (
                <FieldError
                  errors={field.state.meta.errors.map((err) =>
                    typeof err === "string" ? { message: err } : err,
                  )}
                />
              )}
            </Field>
          );
        }}
      />
    </FieldGroup>
  </CardContent>

  <form.Subscribe
    selector={(state) => [state.canSubmit, state.isDirty]}
    children={([canSubmit, isDirty]) => (
      <CardFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={!isDirty || isSaving}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || isSaving || !canSubmit}
        >
          {isSaving && <Spinner />}
          Save
        </Button>
      </CardFooter>
    )}
  />
</form>
```

---

## 4. Specialized Widgets & Component Encapsulation

When a field involves complex interactive behavior (e.g., file dropzones, image cropping, avatar previews):
1. Encapsulate UI & File State: The widget (`AvatarUpload`) handles drag-and-drop, temporary object URLs (`URL.createObjectURL`), and preview rendering internally.
2. Expose Pure Primitives: The widget must communicate with the parent form using simple primitives (`string | null`), not raw `File` objects or internal metadata:
   ```tsx
   <AvatarUpload
     defaultAvatar={data?.image ?? undefined}
     onFileChange={(url) => field.handleChange(url)}
   />
   ```
3. Support Deletion with `null`: When the user removes an existing asset, the widget must emit `null`. This allows the form to detect dirty state and explicitly clear the database value.
4. Prevent Cross-Component Render Warnings: Never call a parent's `onFileChange` / `field.handleChange` synchronously from inside a child hook's `setState((prev) => ...)` updater. Defer notifications to a `useEffect` running in the commit phase.

---

## 5. Summary Checklist Before Finalizing Code

- [ ] Used `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError` instead of custom Tailwind spacing and typography classes.
- [ ] No manual `useState` for loading/saving flags; using `useMutation`'s `isPending`.
- [ ] Zod schema input types match `defaultValues` strictly (e.g. `z.string().nullable()` for `string | null`).
- [ ] Buttons react to form state using `form.Subscribe` with `[canSubmit, isDirty]`.
- [ ] Disabled states applied when `isSaving` is true.
- [ ] No unneeded metadata (e.g., internal IDs, join timestamps) cluttering the form interface.
- [ ] Checked existing file contents before making edits to preserve user changes.
