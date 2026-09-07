# GCFitness Admin Image-Upload CRUD Implementation Plan (Phase 2, Plan 3 of 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real admin CRUD for the 4 remaining phase-1 content types that carry images or richer content — Trusted Partners, Programs, Trainers, and Membership Plans — reusing the AdminShell chrome, shadcn/ui primitives, `DeleteConfirmDialog`, and image-upload endpoint Plan 2 already built.

**Architecture:** Partners follows Plan 2's exact Sheet-drawer-on-index pattern (simplest content type, no separate route). Programs and Trainers each get a full-page create/edit form (richer content, sticky save bar) via two Laravel routes (`GET .../create`, `GET .../{id}/edit`) that both render the *same* Inertia page component — an idiomatic-Laravel adaptation of the source app's single-route-with-a-"new"-sentinel mechanism, keeping its "one component handles create+edit+view" structure. Membership Plans gets the same full-page pattern but without the read-only "View" mode or "Duplicate" action (it never had either in the source app), and without drag-and-drop reordering — the spec lists that as its own later build step, applied once across every reorderable resource, not part of this plan. Every resource stays Inertia-native: controllers validate, mutate, and redirect; no JSON API beyond the existing upload endpoint.

**Tech Stack:** Laravel 12, Inertia.js v2, React 19, the shadcn/ui `Switch`/`Badge` primitives (ported this plan) alongside the full set Plan 2 already ported, `sonner` toasts, the existing `ImageUpload` component and `POST /admin/uploads` endpoint (Plan 2), Inertia's `useForm().transform()` for the two comma/newline-separated-text-to-array fields (Trainer's certifications, Membership Plan's features/home_features).

**Spec:** `docs/superpowers/specs/2026-09-03-gcfitness-admin-cms-design.md`

## Global Constraints

- Inertia-native throughout: no `routes/api.php`, no new JSON endpoints — the only JSON endpoint in this whole phase remains Plan 2's `POST /admin/uploads`, reused here via `uploadType="partner"|"program"|"trainer"` (all three already in its allow-list; Membership Plans has no image field, so it never touches this endpoint).
- Reuse the existing `Partner`, `Program`, `Trainer`, `MembershipPlan` Eloquent models and their phase-1 migrations exactly as-is — no schema changes. All fields this plan's forms need already exist on these models (verified against each model file and migration before writing this plan).
- **Program's admin form carries two description fields** (`description`, the full copy shown on `/programs`, and `home_description`, the short copy shown on the Home page's preview card — a phase-1 addition beyond the source app's own schema, per the spec). `home_description` is validated as `required` in the admin form even though its DB column is nullable, because `Home.jsx` renders `p.home_description` with no fallback — a blank value would show as empty text on a featured program's Home card. 2 of the 8 currently-seeded programs have a blank `home_description` today; this constraint only takes effect the next time each is edited, nothing is retroactively broken.
- **Membership Plan's admin form carries two feature-list fields** (`features`, full list on `/membership`, and `home_features`, the short list on the Home page's preview card — also a phase-1 addition). Both are `required` in the admin form, matching their DB columns, which are already `NOT NULL` JSON columns with no nullable fallback path.
- **Trainer's admin form has no "Featured" toggle.** The source app's `TrainerForm` includes one, but phase 1's actual `trainers` migration/model never added a `featured` column — this is a deliberate, documented deviation (the same kind of content drift already handled elsewhere in this project), not a silent omission. `bio` and `certifications` ARE validated as `required` in the admin form (matching the source app's own UX intent) even though both columns are nullable at the DB level — every one of the 4 currently-seeded trainers already has both populated, so this doesn't break existing data.
- **Membership Plans get create/edit/delete only in this plan — no drag-and-drop reordering.** The source app's `MembershipPlanList` uses `@dnd-kit` for manual reordering, but the spec's build order lists "drag-and-drop reordering" as its own later step, applied once across every resource that needs it — not part of this plan. A new plan's `sort_order` is `max(sort_order) + 1`, matching every other resource's convention in this project; the list renders in existing `sort_order` with no drag handle until that later plan adds one.
- **Programs and Trainers use two Laravel routes rendering one shared Inertia page component.** `GET /admin/{resource}/create` and `GET /admin/{resource}/{id}/edit` both return `inertia('Admin/{Resource}/Form', [...])` — an idiomatic-Laravel adaptation of the source app's single TanStack route with a `"new"` sentinel id, while keeping its "one component handles create, edit, and read-only view" structure. Partners keeps Plan 2's Sheet-drawer-on-index pattern instead (matching the source app's own simpler `PartnerForm`/`PartnerGrid`, which never used a separate route).
- **The read-only "View" mode (Programs, Trainers only)** is reached via `?mode=view` on the edit route's query string, exactly matching the source app's mechanism. `resources/js/Components/admin/breadcrumbSegments.js`'s existing `search.mode === "view"` branch (written in Plan 2, dead code until now since nothing produced a URL with a trailing sub-segment) becomes live for the first time in this plan.
- **`breadcrumbSegments.js`'s create-sentinel check changes from `"new"` to `"create"`** — the one adaptation this plan makes to that function, since Laravel's idiomatic route is `/create`, not a TanStack-style `id=new` param.
- No automated test suite (matching Plans 1-2) — every task ends with a concrete curl/artisan-verifiable step; full visual/interactive confirmation (the sticky save bar's position, the sidebar's new nav entries, breadcrumb rendering) remains an outstanding manual browser check, same as every prior admin-page task in this project.

---

## Task 1: Port Switch and Badge shadcn/ui primitives

Foundational primitives this plan's forms/lists need: `Switch` (Program's Featured toggle, Membership Plan's Popular toggle) and `Badge` (the "Featured"/"Popular" pills shown in the Programs/Membership Plans lists). Ports of `GC-Fitness-Rebrand/src/components/ui/{switch,badge}.tsx`, framework-agnostic — no logic changes beyond stripping TypeScript types. Both packages (`@radix-ui/react-switch`, `class-variance-authority`) are already installed from Plan 1's dependency sync.

**Files:**
- Create: `resources/js/Components/ui/switch.jsx`
- Create: `resources/js/Components/ui/badge.jsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`; `@radix-ui/react-switch`, `class-variance-authority` (both installed in Plan 1's Task 1).
- Produces: `Switch` from `@/Components/ui/switch`; `Badge`, `badgeVariants` from `@/Components/ui/badge` — `Switch` and `Badge` are both consumed by Task 4 (Programs' Featured toggle/badge) and Task 6 (Membership Plans' Popular toggle/badge); Task 5 (Trainers) deliberately consumes neither, since Trainer has no `featured` column (see Global Constraints).

- [ ] **Step 1: Port Switch**

Create `resources/js/Components/ui/switch.jsx`:

```jsx
import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef(({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
        className={cn(
            "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
            className,
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitives.Thumb
            className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
            )}
        />
    </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
```

- [ ] **Step 2: Port Badge**

Create `resources/js/Components/ui/badge.jsx`:

```jsx
import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
                secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
                outline: "text-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

function Badge({ className, variant, ...props }) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

- [ ] **Step 3: Verify**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Components/ui/switch.jsx resources/js/Components/ui/badge.jsx
git commit -m "feat: port Switch and Badge shadcn/ui primitives"
```

---

## Task 2: Admin nav items and breadcrumb-segment updates

Extends the nav module Plan 2 built to include this plan's 4 resources, in the exact grouping and order the source app's own `admin-nav-items.ts` uses, and adapts `breadcrumbSegments.js`'s create-sentinel check from TanStack's `"new"` to Laravel's idiomatic `"create"` route segment.

**Files:**
- Modify: `resources/js/Components/admin/adminNavItems.js`
- Modify: `resources/js/Components/admin/breadcrumbSegments.js`

**Interfaces:**
- Consumes: nothing new.
- Produces: `CONTENT_NAV_ITEMS` (now 5 entries: Programs, Trainers, Membership Plans, Testimonials, FAQs), `SITE_INFO_NAV_ITEMS` (now 3 entries: Trusted Partners, Site Settings, Social Links) — consumed by `AdminShell` (Plan 2, unchanged) and this plan's Tasks 3-6's pages via the sidebar it renders. `getBreadcrumbSegments` unchanged in signature, only its create-sentinel string changes.

- [ ] **Step 1: Extend the nav items module**

The source app's full nav (`GC-Fitness-Rebrand/src/components/admin/shared/admin-nav-items.ts`) groups `CONTENT_NAV_ITEMS` as Programs, Trainers, Membership Plans, Testimonials, FAQs (in that order) and `SITE_INFO_NAV_ITEMS` as Company Stats, Club Locations, Trusted Partners, Site Settings, Social Links. Company Stats and Club Locations aren't built yet (later plans), so they're omitted for now, matching this project's "only list what exists" rule. Replace `resources/js/Components/admin/adminNavItems.js` in full:

```js
import { Dumbbell, Users, CreditCard, MessageSquareQuote, HelpCircle, Handshake, Settings, Share2 } from "lucide-react";

export const CONTENT_NAV_ITEMS = [
    { to: "/admin/programs", label: "Programs", icon: Dumbbell },
    { to: "/admin/trainers", label: "Trainers", icon: Users },
    { to: "/admin/membership-plans", label: "Membership Plans", icon: CreditCard },
    { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
];

export const SITE_INFO_NAV_ITEMS = [
    { to: "/admin/partners", label: "Trusted Partners", icon: Handshake },
    { to: "/admin/site-settings", label: "Site Settings", icon: Settings },
    { to: "/admin/social-links", label: "Social Links", icon: Share2 },
];
```

- [ ] **Step 2: Adapt the breadcrumb create-sentinel check**

In `resources/js/Components/admin/breadcrumbSegments.js`, find this line inside `getBreadcrumbSegments`:

```js
        if (lastPathSegment === "new") {
```

Replace it with:

```js
        if (lastPathSegment === "create") {
```

Nothing else in that function changes — the `else if (search.mode === "view")` / `else { label = "Edit" }` branches immediately below it already produce the correct label for `/admin/programs/{id}/edit` (falls to the `"Edit"` default) and `/admin/programs/{id}/edit?mode=view` (matches the `search.mode === "view"` branch) with no further changes needed.

- [ ] **Step 3: Verify**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Components/admin/adminNavItems.js resources/js/Components/admin/breadcrumbSegments.js
git commit -m "feat: add Programs/Trainers/Membership Plans/Partners to admin nav and breadcrumbs"
```

---

## Task 3: Partners admin resource

Ports `GC-Fitness-Rebrand/src/routes/admin/_authenticated/partners/index.tsx`, `src/components/admin/partners/{partner-grid,partner-form}.tsx`. Simplest of this plan's 4 resources — Sheet-drawer-on-index, exactly like Plan 2's Social Links: no separate route, no "View" mode, no "Duplicate" (the source app never gave Partners either). Uses the existing `ImageUpload` component and `POST /admin/uploads` endpoint (`uploadType="partner"` is already in that endpoint's allow-list).

**Files:**
- Create: `app/Http/Controllers/Admin/PartnerController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Components/admin/PartnerGrid.jsx`
- Create: `resources/js/Components/admin/PartnerForm.jsx`
- Create: `resources/js/Pages/Admin/Partners/Index.jsx`

**Interfaces:**
- Consumes: `App\Models\Partner` (phase 1, `fillable: name, logo_path, sort_order`); `ImageUpload` (Plan 2, `{ value, onChange, uploadType, disabled?, onUploadingChange? }`); `Button`, `Input`, `Label` (Plan 1); `Sheet`* (Plan 2); `DeleteConfirmDialog` (Plan 2); `AdminLayout` (Plan 2); `useUnsavedChangesGuard` (Plan 2).
- Produces: routes `admin.partners.index` (GET `/admin/partners`), `admin.partners.store` (POST), `admin.partners.update` (PUT `/admin/partners/{partner}`), `admin.partners.destroy` (DELETE) — all behind `auth.admin`. The `/admin/partners` page.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/PartnerController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    public function index()
    {
        return inertia('Admin/Partners/Index', [
            'partners' => Partner::orderBy('sort_order')->get(['id', 'name', 'logo_path']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'logo_path' => ['required', 'string', 'max:255'],
        ]);

        $nextOrder = (int) Partner::max('sort_order') + 1;

        Partner::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, Partner $partner)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'logo_path' => ['required', 'string', 'max:255'],
        ]);

        $partner->update($validated);

        return back();
    }

    public function destroy(Partner $partner)
    {
        $partner->delete();

        return back();
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\PartnerController;` to the imports, and add these 4 lines inside the same `Route::middleware('auth.admin')->group(...)` block every other admin content route lives in:

```php
Route::get('partners', [PartnerController::class, 'index'])->name('partners.index');
Route::post('partners', [PartnerController::class, 'store'])->name('partners.store');
Route::put('partners/{partner}', [PartnerController::class, 'update'])->name('partners.update');
Route::delete('partners/{partner}', [PartnerController::class, 'destroy'])->name('partners.destroy');
```

- [ ] **Step 3: Port the grid component**

Create `resources/js/Components/admin/PartnerGrid.jsx`:

```jsx
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function PartnerGrid({ partners, onEdit, onDeleteRequest }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {partners.map((partner) => (
                <div key={partner.id} className="group relative rounded-lg border border-border bg-card p-4">
                    <img src={partner.logo_path} alt={partner.name} className="mx-auto h-16 object-contain" />
                    <p className="mt-2 text-center text-sm text-muted-foreground">{partner.name}</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions for ${partner.name}`}
                                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(partner.id)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteRequest(partner)} className="text-destructive">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ))}
        </div>
    );
}
```

- [ ] **Step 4: Port the form component**

Create `resources/js/Components/admin/PartnerForm.jsx`:

```jsx
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { ImageUpload } from "@/Components/admin/ImageUpload";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function PartnerForm({ initialValues, onCancel, onSaved }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        name: initialValues?.name ?? "",
        logo_path: initialValues?.logo_path ?? "",
    });
    const [uploadingImage, setUploadingImage] = useState(false);

    useUnsavedChangesGuard(isDirty);

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/partners/${initialValues.id}`, options);
        } else {
            post("/admin/partners", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="logo_path">Logo</Label>
                <ImageUpload
                    value={data.logo_path}
                    onChange={(url) => setData("logo_path", url)}
                    uploadType="partner"
                    onUploadingChange={setUploadingImage}
                />
                {errors.logo_path && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.logo_path}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing || uploadingImage}>
                    {processing ? "Saving…" : "Save"}
                </Button>
            </div>
        </form>
    );
}
```

- [ ] **Step 5: Build the index page**

Create `resources/js/Pages/Admin/Partners/Index.jsx`:

```jsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { PartnerForm } from "@/Components/admin/PartnerForm";
import { PartnerGrid } from "@/Components/admin/PartnerGrid";
import AdminLayout from "@/Layouts/AdminLayout";

function PartnersPage({ partners }) {
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    function closeDrawer() {
        setEditing(null);
    }

    function handleSaved() {
        toast.success(editing === "new" ? "Partner created." : "Partner updated.");
        closeDrawer();
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/partners/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Partner deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Trusted Partners — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Trusted Partners</h1>
                    <Button onClick={() => setEditing("new")}>Add partner</Button>
                </div>

                <PartnerGrid
                    partners={partners}
                    onEdit={(id) => setEditing(partners.find((p) => p.id === id) ?? null)}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{editing === "new" ? "Add partner" : "Edit partner"}</SheetTitle>
                        </SheetHeader>
                        {editing !== null && (
                            <PartnerForm initialValues={editing === "new" ? null : editing} onCancel={closeDrawer} onSaved={handleSaved} />
                        )}
                    </SheetContent>
                </Sheet>

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.name ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

PartnersPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default PartnersPage;
```

- [ ] **Step 6: Verify**

Log in via the established curl cookie-jar+XSRF pattern, then:
1. `GET /admin/partners` — confirm HTTP 200, `"component":"Admin/Partners/Index"`, `partners` prop has the phase-1-seeded rows.
2. `POST /admin/partners` with `name=Test Partner&logo_path=/images/placeholder-image.svg` — confirm redirect back, then re-fetch and confirm the new row.
3. `PUT /admin/partners/{id}` on that row changing `name=Test Partner Updated` — confirm the change.
4. `DELETE /admin/partners/{id}` on that row — confirm it's gone.
5. `POST /admin/partners` with a missing `name` — confirm a validation error (not a 500).

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Admin/PartnerController.php routes/web.php resources/js/Components/admin/PartnerGrid.jsx resources/js/Components/admin/PartnerForm.jsx resources/js/Pages/Admin/Partners/Index.jsx
git commit -m "feat: add Trusted Partners admin resource"
```

---

## Task 4: Programs admin resource

Ports `GC-Fitness-Rebrand/src/routes/admin/_authenticated/programs/{index,$programId}.tsx`, `src/components/admin/programs/{program-list,program-form}.tsx`. First of this plan's full-page resources: a separate `create`/`edit` route pair rendering one shared `Admin/Programs/Form` page component (see Global Constraints for why), a sticky bottom save bar, a read-only "View" mode via `?mode=view`, and a `Duplicate` row-menu action implemented client-side as a plain `router.post` to the store route (matching Plan 2's FAQ/Testimonial precedent) — none of these are distinct backend actions. Carries the extra `home_description` field phase 1 added beyond the source app's schema (see Global Constraints for its validation).

**Files:**
- Create: `app/Http/Controllers/Admin/ProgramController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Components/admin/ProgramList.jsx`
- Create: `resources/js/Components/admin/ProgramForm.jsx`
- Create: `resources/js/Pages/Admin/Programs/Index.jsx`
- Create: `resources/js/Pages/Admin/Programs/Form.jsx`

**Interfaces:**
- Consumes: `App\Models\Program` (phase 1, `fillable: title, tag, duration, level, description, home_description, image_path, featured, sort_order`); `ImageUpload` (Plan 2); `Switch`, `Badge` (this plan's Task 1); `Button`, `Input`, `Label`, `Textarea` (Plan 1/Plan 2); `DropdownMenu`*, `Table`* (Plan 2); `DeleteConfirmDialog` (Plan 2); `AdminLayout` (Plan 2); `useUnsavedChangesGuard` (Plan 2).
- Produces: routes `admin.programs.index` (GET `/admin/programs`), `admin.programs.create` (GET `/admin/programs/create`), `admin.programs.store` (POST `/admin/programs`), `admin.programs.edit` (GET `/admin/programs/{program}/edit`), `admin.programs.update` (PUT `/admin/programs/{program}`), `admin.programs.destroy` (DELETE) — all behind `auth.admin`. The `/admin/programs` list page and the shared `/admin/programs/create` + `/admin/programs/{program}/edit` form page.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/ProgramController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    public function index()
    {
        return inertia('Admin/Programs/Index', [
            'programs' => Program::orderBy('sort_order')->get([
                'id', 'title', 'tag', 'duration', 'level', 'description', 'home_description', 'image_path', 'featured',
            ]),
        ]);
    }

    public function create()
    {
        return inertia('Admin/Programs/Form', [
            'program' => null,
            'readOnly' => false,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Program::max('sort_order') + 1;

        Program::create($validated + ['sort_order' => $nextOrder]);

        return redirect()->route('admin.programs.index');
    }

    public function edit(Request $request, Program $program)
    {
        return inertia('Admin/Programs/Form', [
            'program' => $program->only(['id', 'title', 'tag', 'duration', 'level', 'description', 'home_description', 'image_path', 'featured']),
            'readOnly' => $request->query('mode') === 'view',
        ]);
    }

    public function update(Request $request, Program $program)
    {
        $validated = $this->validated($request);

        $program->update($validated);

        return redirect()->route('admin.programs.index');
    }

    public function destroy(Program $program)
    {
        $program->delete();

        return back();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'tag' => ['required', 'string', 'max:255'],
            'duration' => ['required', 'string', 'max:255'],
            'level' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'home_description' => ['required', 'string'],
            'image_path' => ['required', 'string', 'max:255'],
            'featured' => ['required', 'boolean'],
        ]);
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\ProgramController;` to the imports, and add these lines inside the same `auth.admin` group — `create` must be registered before the `{program}`-bound routes:

```php
Route::get('programs', [ProgramController::class, 'index'])->name('programs.index');
Route::get('programs/create', [ProgramController::class, 'create'])->name('programs.create');
Route::post('programs', [ProgramController::class, 'store'])->name('programs.store');
Route::get('programs/{program}/edit', [ProgramController::class, 'edit'])->name('programs.edit');
Route::put('programs/{program}', [ProgramController::class, 'update'])->name('programs.update');
Route::delete('programs/{program}', [ProgramController::class, 'destroy'])->name('programs.destroy');
```

- [ ] **Step 3: Port the list component**

Create `resources/js/Components/admin/ProgramList.jsx`:

```jsx
import { MoreHorizontal } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export function ProgramList({ programs, onDuplicate, onDeleteRequest }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Featured?</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {programs.map((program) => (
                    <TableRow key={program.id}>
                        <TableCell className="font-medium">{program.title}</TableCell>
                        <TableCell>{program.tag}</TableCell>
                        <TableCell>{program.duration}</TableCell>
                        <TableCell>{program.level}</TableCell>
                        <TableCell>{program.featured && <Badge>Featured</Badge>}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${program.title}`}>
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/programs/${program.id}/edit?mode=view`}>View</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/programs/${program.id}/edit`}>Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(program)}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteRequest(program)} className="text-destructive">
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
```

- [ ] **Step 4: Port the form component**

Create `resources/js/Components/admin/ProgramForm.jsx`:

```jsx
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { Textarea } from "@/Components/ui/textarea";
import { ImageUpload } from "@/Components/admin/ImageUpload";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function ProgramForm({ initialValues, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        title: initialValues?.title ?? "",
        tag: initialValues?.tag ?? "",
        duration: initialValues?.duration ?? "",
        level: initialValues?.level ?? "",
        description: initialValues?.description ?? "",
        home_description: initialValues?.home_description ?? "",
        image_path: initialValues?.image_path ?? "",
        featured: initialValues?.featured ?? false,
    });
    const [uploadingImage, setUploadingImage] = useState(false);

    useUnsavedChangesGuard(readOnly ? false : isDirty);

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/programs/${initialValues.id}`, options);
        } else {
            post("/admin/programs", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
            <div className="space-y-2">
                <Label htmlFor="image_path">Image</Label>
                <ImageUpload
                    value={data.image_path}
                    onChange={(url) => setData("image_path", url)}
                    uploadType="program"
                    disabled={readOnly}
                    onUploadingChange={setUploadingImage}
                />
                {errors.image_path && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.image_path}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={data.title} disabled={readOnly} onChange={(e) => setData("title", e.target.value)} />
                {errors.title && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.title}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tag">Tag</Label>
                    <Input id="tag" value={data.tag} disabled={readOnly} onChange={(e) => setData("tag", e.target.value)} />
                    {errors.tag && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.tag}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input id="duration" value={data.duration} disabled={readOnly} onChange={(e) => setData("duration", e.target.value)} />
                    {errors.duration && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.duration}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input id="level" value={data.level} disabled={readOnly} onChange={(e) => setData("level", e.target.value)} />
                    {errors.level && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.level}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    rows={4}
                    value={data.description}
                    disabled={readOnly}
                    onChange={(e) => setData("description", e.target.value)}
                />
                {errors.description && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.description}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="home_description">Home page preview description</Label>
                <Textarea
                    id="home_description"
                    rows={2}
                    value={data.home_description}
                    disabled={readOnly}
                    onChange={(e) => setData("home_description", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">A shorter version shown on the Home page's program preview card.</p>
                {errors.home_description && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.home_description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Switch
                    id="featured"
                    checked={data.featured}
                    onCheckedChange={(checked) => setData("featured", checked)}
                    disabled={readOnly}
                />
                <Label htmlFor="featured">Featured on the public site</Label>
            </div>

            <div className="fixed inset-x-0 bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4">
                {readOnly ? (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Back
                    </Button>
                ) : (
                    <>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || uploadingImage}>
                            {processing ? "Saving…" : "Save"}
                        </Button>
                    </>
                )}
            </div>
        </form>
    );
}
```

- [ ] **Step 5: Build the index (list) page**

Create `resources/js/Pages/Admin/Programs/Index.jsx`:

```jsx
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { ProgramList } from "@/Components/admin/ProgramList";
import AdminLayout from "@/Layouts/AdminLayout";

function ProgramsPage({ programs }) {
    const [deleteTarget, setDeleteTarget] = useState(null);

    function handleDuplicate(program) {
        router.post(
            "/admin/programs",
            {
                title: `${program.title} (Copy)`,
                tag: program.tag,
                duration: program.duration,
                level: program.level,
                description: program.description,
                home_description: program.home_description,
                image_path: program.image_path,
                featured: program.featured,
            },
            {
                onSuccess: () => toast.success("Program created."),
                onError: () => toast.error("Something went wrong."),
            },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/programs/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Program deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Programs — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Programs</h1>
                    <Button asChild>
                        <Link href="/admin/programs/create">Add program</Link>
                    </Button>
                </div>

                <ProgramList programs={programs} onDuplicate={handleDuplicate} onDeleteRequest={setDeleteTarget} />

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.title ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

ProgramsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ProgramsPage;
```

- [ ] **Step 6: Build the shared create/edit form page**

Create `resources/js/Pages/Admin/Programs/Form.jsx`. Note `handleSaved` only shows a toast — it does NOT navigate, since `store()`/`update()` already redirect to `admin.programs.index` server-side, and by the time this callback fires Inertia has already followed that redirect and swapped in the index page:

```jsx
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import { ProgramForm } from "@/Components/admin/ProgramForm";
import AdminLayout from "@/Layouts/AdminLayout";

function ProgramFormPage({ program, readOnly }) {
    const isCreating = program === null;

    function goBack() {
        router.visit("/admin/programs");
    }

    function handleSaved() {
        toast.success(isCreating ? "Program created." : "Program updated.");
    }

    return (
        <>
            <Head title={`${readOnly ? "View" : isCreating ? "Add" : "Edit"} program — GCFitness Admin`} />
            <div className="space-y-6">
                <h1 className="text-2xl font-semibold">{readOnly ? "View program" : isCreating ? "Add program" : "Edit program"}</h1>
                <ProgramForm initialValues={program} onCancel={goBack} onSaved={handleSaved} readOnly={readOnly} />
            </div>
        </>
    );
}

ProgramFormPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ProgramFormPage;
```

- [ ] **Step 7: Verify**

Log in via the established curl cookie-jar+XSRF pattern, then:
1. `GET /admin/programs` — confirm HTTP 200, `"component":"Admin/Programs/Index"`, `programs` prop has the phase-1-seeded rows including `featured`.
2. `GET /admin/programs/create` — confirm HTTP 200, `"component":"Admin/Programs/Form"`, `program` is `null`, `readOnly` is `false`.
3. `POST /admin/programs` with all required fields (`title`, `tag`, `duration`, `level`, `description`, `home_description`, `image_path=/images/placeholder-image.svg`, `featured=1`) — confirm a redirect whose target is `/admin/programs` (not back to the create page), then re-fetch the index and confirm the new row.
4. `GET /admin/programs/{id}/edit` on that row — confirm `program` matches what was created.
5. `PUT /admin/programs/{id}` changing `title` — confirm the change on next index fetch.
6. `GET /admin/programs/{id}/edit?mode=view` — confirm `readOnly` is `true` in the payload.
7. `DELETE /admin/programs/{id}` — confirm it's gone.
8. `POST /admin/programs` with a blank `home_description` — confirm a validation error (not a 500), consistent with the Global Constraint that this field is required in the admin form despite being DB-nullable.

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/Admin/ProgramController.php routes/web.php resources/js/Components/admin/ProgramList.jsx resources/js/Components/admin/ProgramForm.jsx resources/js/Pages/Admin/Programs/Index.jsx resources/js/Pages/Admin/Programs/Form.jsx
git commit -m "feat: add Programs admin resource"
```

---

## Task 5: Trainers admin resource

Ports `GC-Fitness-Rebrand/src/routes/admin/_authenticated/trainers/{index,$trainerId}.tsx`, `src/components/admin/trainers/{trainer-list,trainer-form}.tsx`. Structurally identical to Task 4's Programs resource (separate create/edit routes sharing one `Admin/Trainers/Form` page, sticky save bar, `?mode=view` read-only mode, client-side `Duplicate`), with two differences: **no "Featured" toggle** (Trainer has no `featured` column — see Global Constraints) and **`certifications` is edited as a comma-separated text field**, converted to/from the array the database actually stores via Inertia's `useForm().transform()` — the field itself holds the raw text; the array conversion happens only at the submit boundary, mirroring the source app's own `handleFormSubmit` split/join pattern.

**Files:**
- Create: `app/Http/Controllers/Admin/TrainerController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Components/admin/TrainerList.jsx`
- Create: `resources/js/Components/admin/TrainerForm.jsx`
- Create: `resources/js/Pages/Admin/Trainers/Index.jsx`
- Create: `resources/js/Pages/Admin/Trainers/Form.jsx`

**Interfaces:**
- Consumes: `App\Models\Trainer` (phase 1, `fillable: name, specialty, years_experience, bio, certifications, image_path, sort_order`; `certifications` cast to `array`); `ImageUpload` (Plan 2); `Button`, `Input`, `Label`, `Textarea` (Plan 1/Plan 2); `DropdownMenu`*, `Table`* (Plan 2); `DeleteConfirmDialog` (Plan 2); `AdminLayout` (Plan 2); `useUnsavedChangesGuard` (Plan 2).
- Produces: routes `admin.trainers.index` (GET `/admin/trainers`), `admin.trainers.create` (GET `/admin/trainers/create`), `admin.trainers.store` (POST), `admin.trainers.edit` (GET `/admin/trainers/{trainer}/edit`), `admin.trainers.update` (PUT), `admin.trainers.destroy` (DELETE) — all behind `auth.admin`. The `/admin/trainers` list page and the shared `/admin/trainers/create` + `/admin/trainers/{trainer}/edit` form page.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/TrainerController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Trainer;
use Illuminate\Http\Request;

class TrainerController extends Controller
{
    public function index()
    {
        return inertia('Admin/Trainers/Index', [
            'trainers' => Trainer::orderBy('sort_order')->get([
                'id', 'name', 'specialty', 'years_experience', 'bio', 'certifications', 'image_path',
            ]),
        ]);
    }

    public function create()
    {
        return inertia('Admin/Trainers/Form', [
            'trainer' => null,
            'readOnly' => false,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Trainer::max('sort_order') + 1;

        Trainer::create($validated + ['sort_order' => $nextOrder]);

        return redirect()->route('admin.trainers.index');
    }

    public function edit(Request $request, Trainer $trainer)
    {
        return inertia('Admin/Trainers/Form', [
            'trainer' => $trainer->only(['id', 'name', 'specialty', 'years_experience', 'bio', 'certifications', 'image_path']),
            'readOnly' => $request->query('mode') === 'view',
        ]);
    }

    public function update(Request $request, Trainer $trainer)
    {
        $validated = $this->validated($request);

        $trainer->update($validated);

        return redirect()->route('admin.trainers.index');
    }

    public function destroy(Trainer $trainer)
    {
        $trainer->delete();

        return back();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'specialty' => ['required', 'string', 'max:255'],
            'years_experience' => ['required', 'string', 'max:255'],
            'bio' => ['required', 'string'],
            'certifications' => ['required', 'array', 'min:1'],
            'certifications.*' => ['string'],
            'image_path' => ['required', 'string', 'max:255'],
        ]);
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\TrainerController;` to the imports, and add these lines inside the same `auth.admin` group — `create` before the `{trainer}`-bound routes:

```php
Route::get('trainers', [TrainerController::class, 'index'])->name('trainers.index');
Route::get('trainers/create', [TrainerController::class, 'create'])->name('trainers.create');
Route::post('trainers', [TrainerController::class, 'store'])->name('trainers.store');
Route::get('trainers/{trainer}/edit', [TrainerController::class, 'edit'])->name('trainers.edit');
Route::put('trainers/{trainer}', [TrainerController::class, 'update'])->name('trainers.update');
Route::delete('trainers/{trainer}', [TrainerController::class, 'destroy'])->name('trainers.destroy');
```

- [ ] **Step 3: Port the list component**

Create `resources/js/Components/admin/TrainerList.jsx`:

```jsx
import { MoreHorizontal } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export function TrainerList({ trainers, onDuplicate, onDeleteRequest }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Years</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {trainers.map((trainer) => (
                    <TableRow key={trainer.id}>
                        <TableCell className="font-medium">{trainer.name}</TableCell>
                        <TableCell>{trainer.specialty}</TableCell>
                        <TableCell>{trainer.years_experience}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${trainer.name}`}>
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/trainers/${trainer.id}/edit?mode=view`}>View</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/trainers/${trainer.id}/edit`}>Edit</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(trainer)}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteRequest(trainer)} className="text-destructive">
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
```

- [ ] **Step 4: Port the form component**

Create `resources/js/Components/admin/TrainerForm.jsx`. `certifications` is stored in `useForm`'s `data` as the raw comma-separated text the input actually edits; `transform()` registers a callback that converts it to a trimmed, non-empty `string[]` only at the moment `post()`/`put()` actually sends the request — this is the same technique used to keep the input smooth while still submitting the array shape the server validates:

```jsx
import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { ImageUpload } from "@/Components/admin/ImageUpload";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function TrainerForm({ initialValues, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty, transform } = useForm({
        name: initialValues?.name ?? "",
        specialty: initialValues?.specialty ?? "",
        years_experience: initialValues?.years_experience ?? "",
        bio: initialValues?.bio ?? "",
        certifications: initialValues?.certifications?.join(", ") ?? "",
        image_path: initialValues?.image_path ?? "",
    });
    const [uploadingImage, setUploadingImage] = useState(false);

    useUnsavedChangesGuard(readOnly ? false : isDirty);

    transform((formData) => ({
        ...formData,
        certifications: formData.certifications
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
    }));

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/trainers/${initialValues.id}`, options);
        } else {
            post("/admin/trainers", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
            <div className="space-y-2">
                <Label htmlFor="image_path">Image</Label>
                <ImageUpload
                    value={data.image_path}
                    onChange={(url) => setData("image_path", url)}
                    uploadType="trainer"
                    disabled={readOnly}
                    onUploadingChange={setUploadingImage}
                />
                {errors.image_path && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.image_path}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} disabled={readOnly} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input id="specialty" value={data.specialty} disabled={readOnly} onChange={(e) => setData("specialty", e.target.value)} />
                    {errors.specialty && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.specialty}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="years_experience">Years of experience</Label>
                    <Input
                        id="years_experience"
                        value={data.years_experience}
                        disabled={readOnly}
                        onChange={(e) => setData("years_experience", e.target.value)}
                    />
                    {errors.years_experience && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.years_experience}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={4} value={data.bio} disabled={readOnly} onChange={(e) => setData("bio", e.target.value)} />
                {errors.bio && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.bio}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="certifications">Certifications</Label>
                <Input
                    id="certifications"
                    placeholder="CSCS, NASM-CPT"
                    value={data.certifications}
                    disabled={readOnly}
                    onChange={(e) => setData("certifications", e.target.value)}
                />
                {errors.certifications && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.certifications}
                    </p>
                )}
            </div>

            <div className="fixed inset-x-0 bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4">
                {readOnly ? (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Back
                    </Button>
                ) : (
                    <>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || uploadingImage}>
                            {processing ? "Saving…" : "Save"}
                        </Button>
                    </>
                )}
            </div>
        </form>
    );
}
```

- [ ] **Step 5: Build the index (list) page**

Create `resources/js/Pages/Admin/Trainers/Index.jsx`:

```jsx
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { TrainerList } from "@/Components/admin/TrainerList";
import AdminLayout from "@/Layouts/AdminLayout";

function TrainersPage({ trainers }) {
    const [deleteTarget, setDeleteTarget] = useState(null);

    function handleDuplicate(trainer) {
        router.post(
            "/admin/trainers",
            {
                name: `${trainer.name} (Copy)`,
                specialty: trainer.specialty,
                years_experience: trainer.years_experience,
                bio: trainer.bio,
                certifications: trainer.certifications,
                image_path: trainer.image_path,
            },
            {
                onSuccess: () => toast.success("Trainer created."),
                onError: () => toast.error("Something went wrong."),
            },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/trainers/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Trainer deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Trainers — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Trainers</h1>
                    <Button asChild>
                        <Link href="/admin/trainers/create">Add trainer</Link>
                    </Button>
                </div>

                <TrainerList trainers={trainers} onDuplicate={handleDuplicate} onDeleteRequest={setDeleteTarget} />

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.name ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

TrainersPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default TrainersPage;
```

- [ ] **Step 6: Build the shared create/edit form page**

Create `resources/js/Pages/Admin/Trainers/Form.jsx`:

```jsx
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import { TrainerForm } from "@/Components/admin/TrainerForm";
import AdminLayout from "@/Layouts/AdminLayout";

function TrainerFormPage({ trainer, readOnly }) {
    const isCreating = trainer === null;

    function goBack() {
        router.visit("/admin/trainers");
    }

    function handleSaved() {
        toast.success(isCreating ? "Trainer created." : "Trainer updated.");
    }

    return (
        <>
            <Head title={`${readOnly ? "View" : isCreating ? "Add" : "Edit"} trainer — GCFitness Admin`} />
            <div className="space-y-6">
                <h1 className="text-2xl font-semibold">{readOnly ? "View trainer" : isCreating ? "Add trainer" : "Edit trainer"}</h1>
                <TrainerForm initialValues={trainer} onCancel={goBack} onSaved={handleSaved} readOnly={readOnly} />
            </div>
        </>
    );
}

TrainerFormPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default TrainerFormPage;
```

- [ ] **Step 7: Verify**

Log in via the established curl cookie-jar+XSRF pattern, then:
1. `GET /admin/trainers` — confirm HTTP 200, `"component":"Admin/Trainers/Index"`, `trainers` prop has the phase-1-seeded rows with `certifications` as arrays.
2. `GET /admin/trainers/create` — confirm HTTP 200, `"component":"Admin/Trainers/Form"`, `trainer` is `null`.
3. `POST /admin/trainers` with all required fields (`name`, `specialty`, `years_experience`, `bio`, `certifications[]=CSCS&certifications[]=NASM-CPT`, `image_path=/images/placeholder-image.svg`) — confirm the redirect target is `/admin/trainers`, then re-fetch the index and confirm the new row's `certifications` array.
4. `PUT /admin/trainers/{id}` changing `name` — confirm the change.
5. `GET /admin/trainers/{id}/edit?mode=view` — confirm `readOnly` is `true`.
6. `DELETE /admin/trainers/{id}` — confirm it's gone.
7. `POST /admin/trainers` with `certifications` omitted entirely — confirm a validation error (not a 500).

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/Admin/TrainerController.php routes/web.php resources/js/Components/admin/TrainerList.jsx resources/js/Components/admin/TrainerForm.jsx resources/js/Pages/Admin/Trainers/Index.jsx resources/js/Pages/Admin/Trainers/Form.jsx
git commit -m "feat: add Trainers admin resource"
```

---

## Task 6: Membership Plans admin resource

Ports `GC-Fitness-Rebrand/src/routes/admin/_authenticated/membership-plans/{index,$planId}.tsx`, `src/components/admin/membership-plans/{membership-plan-list,membership-plan-form}.tsx`. Same full-page create/edit pattern as Tasks 4-5, but — matching the source app exactly — **no read-only "View" mode and no "Duplicate"** (Membership Plans never had either), and — per this plan's Global Constraints — **no drag-and-drop reordering** (deferred to a later plan; a new plan's `sort_order` is `max(sort_order) + 1`, and the list renders in that order with no drag handle). Carries the extra `home_features` field phase 1 added beyond the source app's schema, edited the same one-per-line way as `features` and converted to/from an array via `useForm().transform()`, the same technique Task 5 uses for Trainer's `certifications`.

**Files:**
- Create: `app/Http/Controllers/Admin/MembershipPlanController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Components/admin/MembershipPlanList.jsx`
- Create: `resources/js/Components/admin/MembershipPlanForm.jsx`
- Create: `resources/js/Pages/Admin/MembershipPlans/Index.jsx`
- Create: `resources/js/Pages/Admin/MembershipPlans/Form.jsx`

**Interfaces:**
- Consumes: `App\Models\MembershipPlan` (phase 1, `fillable: name, monthly_price, annual_price, popular, home_features, features, sort_order`; `home_features`/`features` cast to `array`); `Switch`, `Badge` (this plan's Task 1); `Button`, `Input`, `Label`, `Textarea` (Plan 1/Plan 2); `DropdownMenu`* (Plan 2); `DeleteConfirmDialog` (Plan 2); `AdminLayout` (Plan 2); `useUnsavedChangesGuard` (Plan 2).
- Produces: routes `admin.membership-plans.index` (GET `/admin/membership-plans`), `admin.membership-plans.create` (GET `/admin/membership-plans/create`), `admin.membership-plans.store` (POST), `admin.membership-plans.edit` (GET `/admin/membership-plans/{membershipPlan}/edit`), `admin.membership-plans.update` (PUT), `admin.membership-plans.destroy` (DELETE) — all behind `auth.admin`. The `/admin/membership-plans` list page and the shared `/admin/membership-plans/create` + `/admin/membership-plans/{membershipPlan}/edit` form page.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/MembershipPlanController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MembershipPlan;
use Illuminate\Http\Request;

class MembershipPlanController extends Controller
{
    public function index()
    {
        return inertia('Admin/MembershipPlans/Index', [
            'plans' => MembershipPlan::orderBy('sort_order')->get(['id', 'name', 'monthly_price', 'annual_price', 'popular']),
        ]);
    }

    public function create()
    {
        return inertia('Admin/MembershipPlans/Form', [
            'plan' => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) MembershipPlan::max('sort_order') + 1;

        MembershipPlan::create($validated + ['sort_order' => $nextOrder]);

        return redirect()->route('admin.membership-plans.index');
    }

    public function edit(MembershipPlan $membershipPlan)
    {
        return inertia('Admin/MembershipPlans/Form', [
            'plan' => $membershipPlan->only(['id', 'name', 'monthly_price', 'annual_price', 'popular', 'home_features', 'features']),
        ]);
    }

    public function update(Request $request, MembershipPlan $membershipPlan)
    {
        $validated = $this->validated($request);

        $membershipPlan->update($validated);

        return redirect()->route('admin.membership-plans.index');
    }

    public function destroy(MembershipPlan $membershipPlan)
    {
        $membershipPlan->delete();

        return back();
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'monthly_price' => ['required', 'integer', 'min:0'],
            'annual_price' => ['required', 'integer', 'min:0'],
            'popular' => ['required', 'boolean'],
            'home_features' => ['required', 'array', 'min:1'],
            'home_features.*' => ['string'],
            'features' => ['required', 'array', 'min:1'],
            'features.*' => ['string'],
        ]);
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\MembershipPlanController;` to the imports, and add these lines inside the same `auth.admin` group — `create` before the `{membershipPlan}`-bound routes:

```php
Route::get('membership-plans', [MembershipPlanController::class, 'index'])->name('membership-plans.index');
Route::get('membership-plans/create', [MembershipPlanController::class, 'create'])->name('membership-plans.create');
Route::post('membership-plans', [MembershipPlanController::class, 'store'])->name('membership-plans.store');
Route::get('membership-plans/{membershipPlan}/edit', [MembershipPlanController::class, 'edit'])->name('membership-plans.edit');
Route::put('membership-plans/{membershipPlan}', [MembershipPlanController::class, 'update'])->name('membership-plans.update');
Route::delete('membership-plans/{membershipPlan}', [MembershipPlanController::class, 'destroy'])->name('membership-plans.destroy');
```

- [ ] **Step 3: Port the list component**

Create `resources/js/Components/admin/MembershipPlanList.jsx` — a card list (matching the source app's shape), not a table; no drag handle in this plan (see Global Constraints):

```jsx
import { MoreHorizontal } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function MembershipPlanList({ plans, onDeleteRequest }) {
    return (
        <div className="space-y-3">
            {plans.map((plan) => (
                <div key={plan.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{plan.name}</span>
                            {plan.popular && <Badge>Popular</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            ${plan.monthly_price}/mo · ${plan.annual_price}/mo billed annually
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Actions for ${plan.name}`}>
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/membership-plans/${plan.id}/edit`}>Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteRequest(plan)} className="text-destructive">
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ))}
        </div>
    );
}
```

- [ ] **Step 4: Port the form component**

Create `resources/js/Components/admin/MembershipPlanForm.jsx`:

```jsx
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { Textarea } from "@/Components/ui/textarea";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function MembershipPlanForm({ initialValues, onCancel, onSaved }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty, transform } = useForm({
        name: initialValues?.name ?? "",
        monthly_price: initialValues?.monthly_price ?? 0,
        annual_price: initialValues?.annual_price ?? 0,
        popular: initialValues?.popular ?? false,
        home_features: initialValues?.home_features?.join("\n") ?? "",
        features: initialValues?.features?.join("\n") ?? "",
    });

    useUnsavedChangesGuard(isDirty);

    transform((formData) => ({
        ...formData,
        home_features: formData.home_features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean),
        features: formData.features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean),
    }));

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/membership-plans/${initialValues.id}`, options);
        } else {
            post("/admin/membership-plans", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="monthly_price">Monthly price</Label>
                    <Input id="monthly_price" type="number" value={data.monthly_price} onChange={(e) => setData("monthly_price", e.target.value)} />
                    {errors.monthly_price && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.monthly_price}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="annual_price">Annual price (per month, billed yearly)</Label>
                    <Input id="annual_price" type="number" value={data.annual_price} onChange={(e) => setData("annual_price", e.target.value)} />
                    {errors.annual_price && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.annual_price}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="home_features">Home page preview features (one per line)</Label>
                <Textarea
                    id="home_features"
                    rows={4}
                    value={data.home_features}
                    onChange={(e) => setData("home_features", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">A shorter feature list shown on the Home page's plan preview card.</p>
                {errors.home_features && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.home_features}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea id="features" rows={5} value={data.features} onChange={(e) => setData("features", e.target.value)} />
                {errors.features && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.features}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Switch id="popular" checked={data.popular} onCheckedChange={(checked) => setData("popular", checked)} />
                <Label htmlFor="popular">Mark as &quot;Most popular&quot;</Label>
            </div>

            <div className="fixed inset-x-0 bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? "Saving…" : "Save"}
                </Button>
            </div>
        </form>
    );
}
```

- [ ] **Step 5: Build the index (list) page**

Create `resources/js/Pages/Admin/MembershipPlans/Index.jsx`:

```jsx
import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { MembershipPlanList } from "@/Components/admin/MembershipPlanList";
import AdminLayout from "@/Layouts/AdminLayout";

function MembershipPlansPage({ plans }) {
    const [deleteTarget, setDeleteTarget] = useState(null);

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/membership-plans/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Membership plan deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Membership Plans — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Membership Plans</h1>
                    <Button asChild>
                        <Link href="/admin/membership-plans/create">Add plan</Link>
                    </Button>
                </div>

                <MembershipPlanList plans={plans} onDeleteRequest={setDeleteTarget} />

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.name ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

MembershipPlansPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default MembershipPlansPage;
```

- [ ] **Step 6: Build the shared create/edit form page**

Create `resources/js/Pages/Admin/MembershipPlans/Form.jsx`:

```jsx
import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import { MembershipPlanForm } from "@/Components/admin/MembershipPlanForm";
import AdminLayout from "@/Layouts/AdminLayout";

function MembershipPlanFormPage({ plan }) {
    const isCreating = plan === null;

    function goBack() {
        router.visit("/admin/membership-plans");
    }

    function handleSaved() {
        toast.success(isCreating ? "Membership plan created." : "Membership plan updated.");
    }

    return (
        <>
            <Head title={`${isCreating ? "Add" : "Edit"} plan — GCFitness Admin`} />
            <div className="space-y-6">
                <h1 className="text-2xl font-semibold">{isCreating ? "Add plan" : "Edit plan"}</h1>
                <MembershipPlanForm initialValues={plan} onCancel={goBack} onSaved={handleSaved} />
            </div>
        </>
    );
}

MembershipPlanFormPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default MembershipPlanFormPage;
```

- [ ] **Step 7: Verify**

Log in via the established curl cookie-jar+XSRF pattern, then:
1. `GET /admin/membership-plans` — confirm HTTP 200, `"component":"Admin/MembershipPlans/Index"`, `plans` prop has the phase-1-seeded rows.
2. `GET /admin/membership-plans/create` — confirm HTTP 200, `"component":"Admin/MembershipPlans/Form"`, `plan` is `null`.
3. `POST /admin/membership-plans` with all required fields (`name`, `monthly_price=50`, `annual_price=40`, `popular=0`, `home_features[]=A`, `features[]=A&features[]=B`) — confirm the redirect target is `/admin/membership-plans`, then re-fetch the index and confirm the new row, which should sort last (highest `sort_order`).
4. `GET /admin/membership-plans/{id}/edit` on that row — confirm `plan.features`/`plan.home_features` are arrays matching what was submitted.
5. `PUT /admin/membership-plans/{id}` changing `name` — confirm the change.
6. `DELETE /admin/membership-plans/{id}` — confirm it's gone.
7. `POST /admin/membership-plans` with `features` omitted entirely — confirm a validation error (not a 500).

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/Admin/MembershipPlanController.php routes/web.php resources/js/Components/admin/MembershipPlanList.jsx resources/js/Components/admin/MembershipPlanForm.jsx resources/js/Pages/Admin/MembershipPlans/Index.jsx resources/js/Pages/Admin/MembershipPlans/Form.jsx
git commit -m "feat: add Membership Plans admin resource"
```

---

## Task 7: Full manual regression pass

No schema changes happen anywhere in this plan (unlike Plan 2's follow-up work), so there's no migration-related transient-connection risk to watch for here — this task is purely functional verification across all 4 resources plus the nav/breadcrumb changes from Task 2.

**Files:** none (verification only).

**Interfaces:** none — this task consumes everything Tasks 1-6 built and produces nothing new.

- [ ] **Step 1: Full regression pass**

Log in via the established curl-based session pattern (or a real browser session if available), then walk through every resource this plan built:

1. **Nav & breadcrumbs** (browser-only, flag for human if this session has no browser access): the sidebar's Content group now shows Programs, Trainers, Membership Plans, Testimonials, FAQs (in that order); Site info now shows Trusted Partners, Site Settings, Social Links. Visiting `/admin/programs/create` shows a breadcrumb trail ending in "Add"; `/admin/programs/{id}/edit` ends in "Edit"; `/admin/programs/{id}/edit?mode=view` ends in "View".
2. **Partners**: create (with an uploaded image), edit, delete — grid reflects each change without a manual refresh, exactly like Plan 2's Social Links.
3. **Programs**: create (with an uploaded image, `home_description`, `featured` toggled on), edit, duplicate, delete, and the View mode (all fields disabled, only a "Back" button, reachable via `?mode=view`).
4. **Trainers**: same 5 checks as Programs, adapted to `certifications` (comma-separated) instead of a Featured toggle — confirm a duplicated trainer's `certifications` array matches the original exactly.
5. **Membership Plans**: create (with `home_features`, `features`, `popular` toggled on), edit, delete — confirm there is no View action and no Duplicate action anywhere in the row menu (matching the source app), and that a newly created plan sorts last.
6. Confirm the public pages this plan's data feeds into still render correctly with any edits reflected: `/programs` (uses `description`, not `home_description`), `/` (uses `home_description` and `home_features` on featured programs' and plans' preview cards), `/about` (trainers), `/membership` (uses `features`, not `home_features`).
7. Confirm no console errors and no broken image icons anywhere in the admin area (browser-only, flag for human if unavailable).

Record the outcome of each check in the task report; do not mark this task complete until all curl/artisan-verifiable checks pass, with the two browser-only checks (1 and 7) explicitly listed as not verifiable from a session without browser access, per the pattern established in Plan 2's own final task.

- [ ] **Step 2: Clean up**

Delete any test rows created during this regression pass so all 4 resources are left showing exactly their phase-1-seeded content, matching the state every prior task's own verification step already leaves things in.

