# GCFitness Admin Locations & Reordering Implementation Plan (Phase 2, Plan 4 of 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real admin CRUD for Club Locations (the last simple content type without one), plus the drag-and-drop reordering interaction Plan 3 deliberately deferred for Membership Plans — the only resource the source app actually lets an admin manually reorder.

**Architecture:** Club Locations follows the exact Sheet-drawer-on-index pattern already established by Partners and Social Links (3 required text fields, no image, no View, no Duplicate). Membership Plans' reordering adds one new endpoint (`PATCH /admin/membership-plans/reorder`, bulk-updating `sort_order` to match the dropped order, then `back()` — matching every other mutation in this project) and ports the source app's `@dnd-kit`-based `SortableRow`/`DndContext` implementation into the already-existing `MembershipPlanList.jsx`, including its documented choice not to optimistically reorder client-side before the server confirms.

**Tech Stack:** Laravel 12, Inertia.js v2, React 19, `@dnd-kit/core`/`@dnd-kit/sortable`/`@dnd-kit/utilities` (installed in Plan 1's dependency sync, unused until now), the existing `Sheet`/`DeleteConfirmDialog`/`AdminLayout`/`useUnsavedChangesGuard` from Plan 2, the existing `Badge` from Plan 3.

**Spec:** `docs/superpowers/specs/2026-09-03-gcfitness-admin-cms-design.md`

## Global Constraints

- Inertia-native throughout: no new JSON API — the reorder endpoint validates, bulk-updates, and redirects with `back()`, exactly like every other mutation in this project; it is not a JSON API response the frontend parses.
- Reuse the existing `ClubLocation` Eloquent model and its phase-1 migration exactly as-is — no schema changes. Its 3 fields (`name`, `address`, `hours`) are already real, seeded content consumed by the public Contact page (`ContactController`) — this plan only adds the missing admin CRUD on top.
- Club Locations has no "View" mode and no "Duplicate" action, matching the source app exactly (a physical address has nothing meaningful to duplicate, and neither Partners nor Social Links — the two other Sheet-drawer resources — has either).
- **Membership Plans is the only resource in this whole phase that gets drag-and-drop reordering.** Confirmed by grepping the entire source app's admin tree for `dnd-kit`/`useSortable`/`DndContext` — no other admin list (Programs, Trainers, Partners, Testimonials, FAQs, Locations) uses it. Do not add reordering to any other resource in this plan.
- The reorder interaction does **not** optimistically update the list before the server responds — this matches the source app's own documented choice (`membership-plan-list.tsx`'s comment: "`plans` is never optimistically updated before the request resolves, so a failed reorder just leaves the list showing its pre-drag order"). A brief visual snap-back on drop, until the round-trip completes, is expected and intentional, not a bug to fix.
- `adminNavItems.js` gains one new entry: "Club Locations" in `SITE_INFO_NAV_ITEMS`, positioned before "Trusted Partners" — matching the source app's own full nav order (`Company Stats, Club Locations, Trusted Partners, Site Settings, Social Links`; Company Stats isn't built yet, so it's still omitted per the established "only list what exists" rule).
- Every task ends with a concrete, curl/artisan-verifiable step. The reorder endpoint's server-side behavior (bulk `sort_order` update) is fully curl-testable with a plain `PATCH` + JSON body; only the actual drag gesture itself remains a browser-only check, flagged for a human, matching every prior admin-page task in this project.

---

## Task 1: Club Locations admin resource

Ports `GC-Fitness-Rebrand/src/routes/admin/_authenticated/locations/index.tsx`, `src/components/admin/locations/{location-list,location-form}.tsx`. Structurally identical to the already-merged Partners resource (Plan 3) and Social Links (Plan 2): Sheet-drawer-on-index, `useForm` (not react-hook-form/zod), no separate route, no View, no Duplicate.

**Files:**
- Create: `app/Http/Controllers/Admin/ClubLocationController.php`
- Modify: `routes/web.php`
- Modify: `resources/js/Components/admin/adminNavItems.js`
- Create: `resources/js/Components/admin/LocationList.jsx`
- Create: `resources/js/Components/admin/LocationForm.jsx`
- Create: `resources/js/Pages/Admin/Locations/Index.jsx`

**Interfaces:**
- Consumes: `App\Models\ClubLocation` (phase 1, `fillable: name, address, hours, sort_order`); `Button`, `Input`, `Label` (Plan 1); `Sheet`* (Plan 2); `DeleteConfirmDialog` (Plan 2); `AdminLayout` (Plan 2); `useUnsavedChangesGuard` (Plan 2).
- Produces: routes `admin.locations.index` (GET `/admin/locations`), `admin.locations.store` (POST), `admin.locations.update` (PUT `/admin/locations/{location}`), `admin.locations.destroy` (DELETE) — all behind `auth.admin`. The `/admin/locations` page. `SITE_INFO_NAV_ITEMS` gains a "Club Locations" entry.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/ClubLocationController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClubLocation;
use Illuminate\Http\Request;

class ClubLocationController extends Controller
{
    public function index()
    {
        return inertia('Admin/Locations/Index', [
            'locations' => ClubLocation::orderBy('sort_order')->get(['id', 'name', 'address', 'hours']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'hours' => ['required', 'string', 'max:255'],
        ]);

        $nextOrder = (int) ClubLocation::max('sort_order') + 1;

        ClubLocation::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, ClubLocation $location)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'hours' => ['required', 'string', 'max:255'],
        ]);

        $location->update($validated);

        return back();
    }

    public function destroy(ClubLocation $location)
    {
        $location->delete();

        return back();
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\ClubLocationController;` to the imports, and add these 4 lines inside the same `Route::middleware('auth.admin')->group(...)` block every other admin content route lives in:

```php
Route::get('locations', [ClubLocationController::class, 'index'])->name('locations.index');
Route::post('locations', [ClubLocationController::class, 'store'])->name('locations.store');
Route::put('locations/{location}', [ClubLocationController::class, 'update'])->name('locations.update');
Route::delete('locations/{location}', [ClubLocationController::class, 'destroy'])->name('locations.destroy');
```

- [ ] **Step 3: Add Club Locations to the sidebar nav**

Read `resources/js/Components/admin/adminNavItems.js` first, then add a `MapPin` icon import and insert the new entry into `SITE_INFO_NAV_ITEMS`, positioned before "Trusted Partners":

```js
import { Dumbbell, Users, CreditCard, MessageSquareQuote, HelpCircle, MapPin, Handshake, Settings, Share2 } from "lucide-react";

export const CONTENT_NAV_ITEMS = [
    { to: "/admin/programs", label: "Programs", icon: Dumbbell },
    { to: "/admin/trainers", label: "Trainers", icon: Users },
    { to: "/admin/membership-plans", label: "Membership Plans", icon: CreditCard },
    { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
];

export const SITE_INFO_NAV_ITEMS = [
    { to: "/admin/locations", label: "Club Locations", icon: MapPin },
    { to: "/admin/partners", label: "Trusted Partners", icon: Handshake },
    { to: "/admin/site-settings", label: "Site Settings", icon: Settings },
    { to: "/admin/social-links", label: "Social Links", icon: Share2 },
];
```

`CONTENT_NAV_ITEMS` is unchanged — only `SITE_INFO_NAV_ITEMS` gains the new entry.

- [ ] **Step 4: Port the list component**

Create `resources/js/Components/admin/LocationList.jsx`:

```jsx
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function LocationList({ locations, onEdit, onDeleteRequest }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((location) => (
                <div key={location.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-start justify-between">
                        <h3 className="font-medium">{location.name}</h3>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={`Actions for ${location.name}`}>
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(location.id)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDeleteRequest(location)} className="text-destructive">
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{location.address}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{location.hours}</p>
                </div>
            ))}
        </div>
    );
}
```

- [ ] **Step 5: Port the form component**

Create `resources/js/Components/admin/LocationForm.jsx`:

```jsx
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function LocationForm({ initialValues, onCancel, onSaved }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        name: initialValues?.name ?? "",
        address: initialValues?.address ?? "",
        hours: initialValues?.hours ?? "",
    });

    useUnsavedChangesGuard(isDirty);

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/locations/${initialValues.id}`, options);
        } else {
            post("/admin/locations", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={data.address} onChange={(e) => setData("address", e.target.value)} />
                {errors.address && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.address}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="hours">Hours</Label>
                <Input id="hours" value={data.hours} onChange={(e) => setData("hours", e.target.value)} />
                {errors.hours && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.hours}
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
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

- [ ] **Step 6: Build the index page**

Create `resources/js/Pages/Admin/Locations/Index.jsx`:

```jsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { LocationForm } from "@/Components/admin/LocationForm";
import { LocationList } from "@/Components/admin/LocationList";
import AdminLayout from "@/Layouts/AdminLayout";

function LocationsPage({ locations }) {
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    function closeDrawer() {
        setEditing(null);
    }

    function handleSaved() {
        toast.success(editing === "new" ? "Location created." : "Location updated.");
        closeDrawer();
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/locations/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Location deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Club Locations — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Club Locations</h1>
                    <Button onClick={() => setEditing("new")}>Add location</Button>
                </div>

                <LocationList
                    locations={locations}
                    onEdit={(id) => setEditing(locations.find((l) => l.id === id) ?? null)}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{editing === "new" ? "Add location" : "Edit location"}</SheetTitle>
                        </SheetHeader>
                        {editing !== null && (
                            <LocationForm initialValues={editing === "new" ? null : editing} onCancel={closeDrawer} onSaved={handleSaved} />
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

LocationsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default LocationsPage;
```

- [ ] **Step 7: Verify**

Log in via the established curl cookie-jar+XSRF pattern, then:
1. `GET /admin/locations` — confirm HTTP 200, `"component":"Admin/Locations/Index"`, `locations` prop has the phase-1-seeded rows.
2. `POST /admin/locations` with `name=Test Location&address=123 Test St&hours=9am-5pm` — confirm redirect back, then re-fetch and confirm the new row.
3. `PUT /admin/locations/{id}` on that row changing `name=Test Location Updated` — confirm the change.
4. `DELETE /admin/locations/{id}` on that row — confirm it's gone.
5. `POST /admin/locations` with a missing `hours` — confirm a validation error (not a 500).
6. Confirm the public `/contact` page (which reads the same `ClubLocation` rows via `ContactController`) still renders correctly after this task's changes.

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/Admin/ClubLocationController.php routes/web.php resources/js/Components/admin/adminNavItems.js resources/js/Components/admin/LocationList.jsx resources/js/Components/admin/LocationForm.jsx resources/js/Pages/Admin/Locations/Index.jsx
git commit -m "feat: add Club Locations admin resource"
```

---

## Task 2: Drag-and-drop reordering for Membership Plans

Ports `GC-Fitness-Rebrand/src/components/admin/membership-plans/membership-plan-list.tsx`'s `@dnd-kit`-based `SortableRow`/`DndContext` implementation into the already-existing `MembershipPlanList.jsx` (built without it in Plan 3, which explicitly deferred this), and adds the one new endpoint this needs: `PATCH /admin/membership-plans/reorder`. This is the only resource in this whole phase that gets reordering — see Global Constraints for why.

**Files:**
- Modify: `app/Http/Controllers/Admin/MembershipPlanController.php`
- Modify: `routes/web.php`
- Modify: `resources/js/Components/admin/MembershipPlanList.jsx`
- Modify: `resources/js/Pages/Admin/MembershipPlans/Index.jsx`

**Interfaces:**
- Consumes: `@dnd-kit/core` (`DndContext`, `closestCenter`, `PointerSensor`, `useSensor`, `useSensors`), `@dnd-kit/sortable` (`SortableContext`, `arrayMove`, `useSortable`, `verticalListSortingStrategy`), `@dnd-kit/utilities` (`CSS`) — all installed in Plan 1's dependency sync, unused until this task; `Badge` (Plan 3).
- Produces: route `admin.membership-plans.reorder` (PATCH `/admin/membership-plans/reorder`, behind `auth.admin`, accepting `{ ids: number[] }`). `MembershipPlanList` gains a required `onReorder(orderedIds: number[]): void` prop.

- [ ] **Step 1: Add the reorder endpoint**

In `app/Http/Controllers/Admin/MembershipPlanController.php`, read the file first (it already has `index`/`create`/`store`/`edit`/`update`/`destroy`/`validated` from Plan 3 — add this new public method alongside them, don't remove anything):

```php
public function reorder(Request $request)
{
    $validated = $request->validate([
        'ids' => ['required', 'array'],
        'ids.*' => ['integer', 'exists:membership_plans,id'],
    ]);

    foreach ($validated['ids'] as $index => $id) {
        MembershipPlan::where('id', $id)->update(['sort_order' => $index + 1]);
    }

    return back();
}
```

- [ ] **Step 2: Add the route**

In `routes/web.php`, add this line inside the existing `auth.admin` group, alongside the other `membership-plans` routes from Plan 3 (register it before the `{membershipPlan}`-bound routes, matching this project's established static-before-dynamic route ordering, even though no other route currently uses the `PATCH` verb on this resource):

```php
Route::patch('membership-plans/reorder', [MembershipPlanController::class, 'reorder'])->name('membership-plans.reorder');
```

- [ ] **Step 3: Port the drag-and-drop list component**

Replace `resources/js/Components/admin/MembershipPlanList.jsx` in full:

```jsx
import { GripVertical, MoreHorizontal } from "lucide-react";
import { Link } from "@inertiajs/react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

function SortableRow({ plan, onDeleteRequest }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: plan.id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-4"
        >
            <button
                {...attributes}
                {...listeners}
                aria-label={`Reorder ${plan.name}`}
                className="cursor-grab text-muted-foreground hover:text-foreground"
            >
                <GripVertical className="size-4" />
            </button>
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
    );
}

export function MembershipPlanList({ plans, onDeleteRequest, onReorder }) {
    const sensors = useSensors(useSensor(PointerSensor));

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }
        const oldIndex = plans.findIndex((p) => p.id === active.id);
        const newIndex = plans.findIndex((p) => p.id === over.id);
        onReorder(arrayMove(plans, oldIndex, newIndex).map((p) => p.id));
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={plans.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {plans.map((plan) => (
                        <SortableRow key={plan.id} plan={plan} onDeleteRequest={onDeleteRequest} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
```

Note `plans` itself is never optimistically reordered here — `handleDragEnd` only computes the ids to send to `onReorder`; the actual re-render only happens once the server round-trip (Step 4) refreshes `plans` via its own `back()` redirect. This is the deliberate, source-app-matching behavior described in the Global Constraints.

- [ ] **Step 4: Wire the reorder handler into the index page**

In `resources/js/Pages/Admin/MembershipPlans/Index.jsx`, read the file first (it already has `handleConfirmDelete` etc. from Plan 3 — add the new handler alongside it, don't remove anything), then add:

```jsx
function handleReorder(orderedIds) {
    router.patch(
        "/admin/membership-plans/reorder",
        { ids: orderedIds },
        {
            preserveScroll: true,
            onError: () => toast.error("Something went wrong."),
        },
    );
}
```

And pass the new prop to the existing `<MembershipPlanList>` element:

```jsx
<MembershipPlanList plans={plans} onDeleteRequest={setDeleteTarget} onReorder={handleReorder} />
```

`preserveScroll: true` keeps the viewport from jumping to the top mid-drag-interaction — the only mutation in this project where that matters, since every earlier one is triggered by a discrete click, not a drag gesture the admin is mid-interacting with.

- [ ] **Step 5: Verify**

Log in via the established curl cookie-jar+XSRF pattern, then:
1. `GET /admin/membership-plans` — confirm HTTP 200, note the current `sort_order` of all 3 seeded plans (should be 1, 2, 3).
2. `PATCH /admin/membership-plans/reorder` with `ids[]=<id of plan currently sort_order=3>&ids[]=<id of plan currently sort_order=2>&ids[]=<id of plan currently sort_order=1>` (i.e. the full reverse order) — confirm redirect back, then re-fetch the index and confirm the 3 plans now appear in exactly that reversed order.
3. `PATCH /admin/membership-plans/reorder` again with the original order to restore it — confirm the index is back to the original sequence.
4. `PATCH /admin/membership-plans/reorder` with an `ids` array containing a non-existent id (e.g. `999999`) — confirm a validation error (not a 500), and that no `sort_order` values were changed as a side effect.
5. `npm run build` — confirm it succeeds (this is the first task in this plan to actually import `@dnd-kit/*`, so this is the first real compile check of those packages in this project).

The actual drag gesture itself (picking up a row with the mouse, dropping it elsewhere) is browser-only and cannot be exercised from this session — flag it for a human to confirm, same as every prior task's own visual/interactive checks in this project.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Admin/MembershipPlanController.php routes/web.php resources/js/Components/admin/MembershipPlanList.jsx resources/js/Pages/Admin/MembershipPlans/Index.jsx
git commit -m "feat: add drag-and-drop reordering to Membership Plans"
```

---

## Task 3: Full manual regression pass

No schema changes happen anywhere in this plan, so there's no migration-related transient-connection risk to watch for. This task verifies both of this plan's pieces together and confirms nothing in the 3 prior plans regressed.

**Files:** none (verification only).

**Interfaces:** none — this task consumes everything Tasks 1-2 built and produces nothing new.

- [ ] **Step 1: Full regression pass**

Log in via the established curl-based session pattern (or a real browser session if available), then walk through everything this plan touched:

1. **Nav** (browser-only, flag for human if this session has no browser access): the sidebar's Site info group now shows Club Locations, Trusted Partners, Site Settings, Social Links in that order.
2. **Club Locations**: create, edit, delete — grid reflects each change without a manual refresh. Confirm there is no View and no Duplicate action anywhere (matching Partners/Social Links).
3. **Membership Plans reordering**: exercise the reorder endpoint directly via curl (full reverse, then restore) and confirm the index reflects each new order. Confirm plain create/edit/delete (Plan 3's functionality) still works unchanged after this task's `MembershipPlanList.jsx` rewrite.
4. **Public `/contact` page**: confirm it still renders the Club Locations content correctly (the same rows the admin resource now manages).
5. Confirm no console errors anywhere in the admin area (browser-only, flag for human if unavailable).

Record the outcome of each check in the task report; do not mark this task complete until all curl/artisan-verifiable checks pass, with the browser-only checks explicitly listed as not verifiable from a session without browser access.

- [ ] **Step 2: Clean up**

Delete any test rows created during this regression pass so Club Locations shows exactly its phase-1-seeded content, and confirm Membership Plans is back to its original `sort_order` sequence.
