# GCFitness Admin Backlog Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Work through the 15 Minor/polish findings accumulated across every prior phase-2 plan's final review, all explicitly selected by the user for treatment now: auth/account-security polish, Dashboard cleanup, and earlier CRUD-form polish.

**Architecture:** Three independent, unrelated groups of small fixes to existing code — no new subsystems, no schema changes beyond one narrow data backfill. Each task is a self-contained cleanup pass over files already built in earlier plans. Every fix below was diagnosed against this codebase's actual current files before this plan was written — no guessing, no placeholders.

**Tech Stack:** Laravel 12, Inertia.js v2, React 19 — unchanged. No new dependencies.

## Global Constraints

- No schema changes except one: backfilling `home_description` on legacy `Program` rows that predate that column's requirement (a data fix, not a structural change — no migration needed for the column itself, it already exists and is nullable at the DB level even though the admin form requires it). **This one migration must be run against the real dev database at finish time** (never `migrate:fresh`), exactly like the auth-refactor plan's finishing step — that's the only place the actual legacy null-`home_description` rows exist; the isolated worktree used during implementation has its own separate (SQLite) database with its own seeded data.
- Every fix stays scoped to exactly the finding it addresses — no incidental refactoring, no touching adjacent code "while we're in there."
- Follow this project's established conventions throughout: Inertia-native controllers (no JSON API), `role="alert"` + inline field errors on forms, the existing `cn()` utility for conditional classes, the existing `Card`/`Dialog`/`Button` primitives.
- Password rules use Laravel's built-in `Illuminate\Validation\Rules\Password` class — no custom regex, no new package.
- The `hashed` cast already declared on `User::password` (`app/Models/User.php`) auto-hashes any plain-text value assigned to it — every `Hash::make()` call this plan removes is redundant specifically because of that cast, and removing it is a pure simplification with no behavior change (Laravel's hashed cast is itself safe against double-hashing an already-hashed value, so this was never a correctness bug, just unnecessary code).

---

## Task 1: Auth & account security polish

**Files:**
- Modify: `app/Http/Controllers/Admin/AuthController.php`
- Modify: `app/Http/Controllers/Admin/AccountController.php`
- Modify: `app/Http/Controllers/Admin/AdminAccountController.php`
- Modify: `resources/js/Components/admin/TempPasswordDialog.jsx`
- Modify: `resources/js/Components/admin/breadcrumbSegments.js`
- Modify: `bootstrap/app.php`
- Create: `resources/js/Pages/Error.jsx`

**Interfaces:**
- Consumes: `Illuminate\Validation\Rules\Password` (built into Laravel, no new dependency); `Illuminate\Auth\Events\Attempting`/`Failed` (built-in); the existing `Dialog`/`Button` UI primitives.
- Produces: no new routes, no new props — every change here is internal to existing endpoints/components. `resources/js/Pages/Error.jsx` becomes the shared error page Laravel/Inertia renders for 403/404/419/429/500/503 responses outside local/testing environments.

- [ ] **Step 1: Strengthen the password policy and reject reusing the current password**

In `app/Http/Controllers/Admin/AuthController.php`, add the import:

```php
use Illuminate\Validation\Rules\Password;
```

Replace `setPassword()` in full:

```php
    public function setPassword(Request $request)
    {
        abort_unless($request->user()->must_change_password, 403);

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $request->user();

        if (Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'Please choose a password different from your current one.',
            ]);
        }

        $user->forceFill(['password' => $validated['password']])->save();
        $user->clearTemporaryPassword();

        DB::table('sessions')->where('user_id', $user->id)->where('id', '!=', $request->session()->getId())->delete();
        $request->session()->regenerate();

        return redirect()->route('admin.dashboard');
    }
```

In `app/Http/Controllers/Admin/AccountController.php`, add the import (its current imports already include `Illuminate\Support\Facades\DB` from the auth-refactor plan's session-invalidation fix — only `Password` is new here):

```php
use Illuminate\Validation\Rules\Password;
```

Replace `changePassword()` in full:

```php
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Your current password is incorrect.',
            ]);
        }

        if (Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'Please choose a password different from your current one.',
            ]);
        }

        $user->forceFill(['password' => $validated['password']])->save();

        DB::table('sessions')->where('user_id', $user->id)->where('id', '!=', $request->session()->getId())->delete();
        $request->session()->regenerate();

        return back()->with('message', 'Your password has been updated.');
    }
```

- [ ] **Step 2: Drop the now-redundant `Hash::make()` calls**

In `app/Http/Controllers/Admin/AdminAccountController.php`, find `store()`:

```php
        $admin = User::create($validated + [
            'password' => Hash::make(Str::random(32)),
            'role' => 'admin',
        ]);
```

Change to:

```php
        $admin = User::create($validated + [
            'password' => Str::random(32),
            'role' => 'admin',
        ]);
```

If `Hash` is no longer used anywhere else in this file after this change, remove its `use Illuminate\Support\Facades\Hash;` import too (check the rest of the file first — `resetAccess`/`deactivate`/`reactivate`/`destroy`/`index`/`store` don't use `Hash` directly once this line changes, since `issueTemporaryPassword()` lives on the `User` model, not here).

(Steps 1's edits to `AuthController.php`/`AccountController.php` already replace their own `Hash::make(...)` calls with plain-string assignment relying on the cast — no separate action needed for those two files beyond what Step 1 already wrote.)

- [ ] **Step 3: Restore the `Attempting`/`Failed` auth events dropped when `Auth::attempt()` was replaced**

In `app/Http/Controllers/Admin/AuthController.php`, add the imports:

```php
use Illuminate\Auth\Events\Attempting;
use Illuminate\Auth\Events\Failed;
```

In `login()`, dispatch `Attempting` right after validating, and `Failed` in the failure branch:

```php
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        event(new Attempting('web', $credentials, $request->boolean('remember')));

        $user = User::where('email', $credentials['email'])->first();

        $authenticated = app(Timebox::class)->call(function () use ($user, $credentials) {
            return $user
                && $user->is_active
                && (Hash::check($credentials['password'], $user->password)
                    || $user->hasValidTemporaryPassword($credentials['password']));
        }, 200000);

        if (! $authenticated) {
            event(new Failed('web', $user, $credentials));

            throw ValidationException::withMessages([
                'email' => 'Invalid email or password. Please try again.',
            ]);
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        return redirect()->route('admin.dashboard');
    }
```

- [ ] **Step 4: Fix the temp-password dialog's stale "copied" checkmark and unguarded clipboard call**

Replace `resources/js/Components/admin/TempPasswordDialog.jsx` in full:

```jsx
import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog";

export function TempPasswordDialog({ password, onOpenChange }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setCopied(false);
    }, [password]);

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(password);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    }

    return (
        <Dialog open={password !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Temporary password generated</DialogTitle>
                    <DialogDescription>
                        Share this with the admin now — it won't be shown again, and expires in 1 hour if unused.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm">
                    <span className="flex-1 select-all">{password}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy temporary password">
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </Button>
                </div>
                <DialogFooter>
                    <Button type="button" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
```

- [ ] **Step 5: Add a breadcrumb for the Change Password page**

In `resources/js/Components/admin/breadcrumbSegments.js`, add two constants near the top and one new early-return branch:

```js
const DASHBOARD_PATH = "/admin/dashboard";
const DASHBOARD_LABEL = "Dashboard";
const ACCOUNT_PASSWORD_PATH = "/admin/account/password";
const ACCOUNT_PASSWORD_LABEL = "Change Password";

const ALL_NAV_ITEMS = [...CONTENT_NAV_ITEMS, ...SITE_INFO_NAV_ITEMS, ...SUPER_ADMIN_NAV_ITEMS];

export function getBreadcrumbSegments(pathname, search) {
    if (pathname === DASHBOARD_PATH) {
        return [{ label: DASHBOARD_LABEL, to: DASHBOARD_PATH }];
    }

    if (pathname === ACCOUNT_PASSWORD_PATH) {
        return [{ label: DASHBOARD_LABEL, to: DASHBOARD_PATH }, { label: ACCOUNT_PASSWORD_LABEL }];
    }

    const segments = [{ label: DASHBOARD_LABEL, to: DASHBOARD_PATH }];
```

(Only the two new constants and the new `if` block are additions — everything else in the file stays exactly as-is.)

- [ ] **Step 6: Render a proper Inertia error page instead of a raw error response**

Create `resources/js/Pages/Error.jsx`:

```jsx
import { Head } from "@inertiajs/react";

const STATUS_MESSAGES = {
    403: "You don't have permission to access this page.",
    404: "The page you're looking for doesn't exist.",
    419: "This page expired, please try again.",
    429: "Too many requests. Please slow down and try again shortly.",
    500: "Something went wrong on our end.",
    503: "The site is temporarily unavailable. Please check back soon.",
};

export default function Error({ status }) {
    const message = STATUS_MESSAGES[status] ?? "An unexpected error occurred.";

    return (
        <>
            <Head title={`${status} — GCFitness`} />
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
                <h1 className="text-6xl font-bold text-brand">{status}</h1>
                <p className="text-lg text-muted-foreground">{message}</p>
                <a href="/" className="text-sm font-medium text-primary hover:underline">
                    Go back home
                </a>
            </div>
        </>
    );
}
```

In `bootstrap/app.php`, add the imports:

```php
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Throwable;
```

Replace the empty `withExceptions` block:

```php
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
```

with:

```php
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request) {
            if ($response->getStatusCode() === 419) {
                return back()->with('message', 'The page expired, please try again.');
            }

            if (! app()->environment(['local', 'testing']) && in_array($response->getStatusCode(), [403, 404, 419, 429, 500, 503])) {
                return Inertia::render('Error', ['status' => $response->getStatusCode()])
                    ->toResponse($request)
                    ->setStatusCode($response->getStatusCode());
            }

            return $response;
        });
    })->create();
```

This only changes behavior outside `local`/`testing` environments (i.e. in production), so local development still shows Laravel's normal detailed error/debug pages — the friendly page is purely a production-facing improvement.

- [ ] **Step 7: Verify**

1. `php artisan test` — confirm the existing `AdminAccountSecurityTest` suite still passes unchanged (none of these edits touch the behavior those tests assert on — `must_change_password` gating, session deletion, etc. — only the password-strength rule and the reuse check are new validation layers on top).
2. Via curl (established login-then-cookie-jar pattern): attempt to set a new password that's all-letters (e.g. `abcdefgh`) via `POST /admin/set-password` while `must_change_password` is true — confirm a 422 validation error (fails the `numbers()` requirement).
3. Attempt to set the password back to the account's *current* password — confirm a 422 with the "different from your current one" message.
4. Set a valid new password meeting the policy — confirm success (302).
5. Repeat the reuse check for `POST /admin/account/password` (self-service change).
6. `npm run build` — confirm it succeeds (first compile check of `Error.jsx` and the `TempPasswordDialog.jsx`/`breadcrumbSegments.js` edits).
7. Confirm `GET /admin/account/password`'s breadcrumb now reads "Dashboard / Change Password" instead of a bare "Dashboard" (check the `data-page` JSON's rendered breadcrumb, or a real browser if available).

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/Admin/AuthController.php app/Http/Controllers/Admin/AccountController.php app/Http/Controllers/Admin/AdminAccountController.php resources/js/Components/admin/TempPasswordDialog.jsx resources/js/Components/admin/breadcrumbSegments.js bootstrap/app.php resources/js/Pages/Error.jsx
git commit -m "fix: strengthen password policy, restore auth events, and polish account UI"
```

---

## Task 2: Dashboard cleanup

**Files:**
- Modify: `app/Http/Controllers/Admin/DashboardController.php`
- Modify: `resources/js/Components/admin/DashboardOverviewCards.jsx`
- Modify: `resources/js/Components/admin/StatCard.jsx`
- Modify: `resources/js/Components/admin/DashboardRecentActivityList.jsx`
- Modify: `resources/js/Components/ui/chart.jsx`

**Interfaces:**
- Consumes: `cn()` from `@/lib/utils` (already used throughout this project).
- Produces: `DashboardController::index()`'s `counts` prop shape is unchanged (same 7 keys, same values) — only how it's computed internally changes. `StatCard` gains an optional `className` prop, backward-compatible with its one existing caller.

- [ ] **Step 1: Make `TRACKED_RESOURCES` the single source of truth for both counts and activity**

In `app/Http/Controllers/Admin/DashboardController.php`, replace the `TRACKED_RESOURCES` constant and `index()` method:

```php
    private const TRACKED_RESOURCES = [
        ['model' => Program::class, 'label' => 'program', 'name_column' => 'title', 'count_key' => 'programs'],
        ['model' => Trainer::class, 'label' => 'trainer', 'name_column' => 'name', 'count_key' => 'trainers'],
        ['model' => MembershipPlan::class, 'label' => 'membership plan', 'name_column' => 'name', 'count_key' => 'membershipPlans'],
        ['model' => Partner::class, 'label' => 'partner', 'name_column' => 'name', 'count_key' => 'partners'],
        ['model' => ClubLocation::class, 'label' => 'location', 'name_column' => 'name', 'count_key' => 'locations'],
        ['model' => Testimonial::class, 'label' => 'testimonial', 'name_column' => 'name', 'count_key' => 'testimonials'],
        ['model' => Faq::class, 'label' => 'FAQ', 'name_column' => 'question', 'count_key' => 'faqs'],
    ];

    public function index()
    {
        return inertia('Admin/Dashboard', [
            'counts' => $this->counts(),
            'recentActivity' => $this->recentActivity(),
            'activityByDay' => $this->activityByDay(),
        ]);
    }

    /**
     * Derives counts from the same TRACKED_RESOURCES table recentActivity()
     * and activityByDay() already use, rather than a second hand-written
     * list — the two can no longer drift apart.
     */
    private function counts(): array
    {
        return collect(self::TRACKED_RESOURCES)
            ->mapWithKeys(fn ($resource) => [$resource['count_key'] => $resource['model']::count()])
            ->all();
    }
```

Leave `recentActivity()` and `activityByDay()` exactly as they are — they already read from `TRACKED_RESOURCES` and don't reference `count_key`, so they're unaffected by this addition.

- [ ] **Step 2: Guard against an unknown count key and fix the ragged last row**

Add a `className` prop to `resources/js/Components/admin/StatCard.jsx`:

```jsx
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/Components/ui/card";

export function StatCard({ label, value, icon: Icon, className }) {
    return (
        <Card className={cn(className)}>
            <CardContent className="flex items-center gap-4 p-6">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Icon className="size-5" />
                </span>
                <div>
                    <div className="text-2xl font-semibold leading-tight">{value}</div>
                    <div className="text-sm text-muted-foreground">{label}</div>
                </div>
            </CardContent>
        </Card>
    );
}
```

Replace `resources/js/Components/admin/DashboardOverviewCards.jsx` in full:

```jsx
import { Dumbbell, Users, CreditCard, Handshake, MapPin, MessageSquareQuote, HelpCircle } from "lucide-react";
import { StatCard } from "@/Components/admin/StatCard";

const COUNT_META = {
    programs: { label: "Programs", icon: Dumbbell },
    trainers: { label: "Trainers", icon: Users },
    membershipPlans: { label: "Membership Plans", icon: CreditCard },
    partners: { label: "Trusted Partners", icon: Handshake },
    locations: { label: "Club Locations", icon: MapPin },
    testimonials: { label: "Testimonials", icon: MessageSquareQuote },
    faqs: { label: "FAQs", icon: HelpCircle },
};

export function DashboardOverviewCards({ counts }) {
    // Filters out any key COUNT_META doesn't recognize instead of crashing —
    // the two lists are independent (this one needs icons, a frontend-only
    // concern) so a future 8th tracked resource landing here before this
    // map is updated should degrade gracefully, not white-screen the page.
    const countKeys = Object.keys(counts).filter((key) => COUNT_META[key]);

    return (
        <div className="flex flex-wrap justify-center gap-4">
            {countKeys.map((key) => (
                <StatCard
                    key={key}
                    label={COUNT_META[key].label}
                    value={counts[key]}
                    icon={COUNT_META[key].icon}
                    className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
                />
            ))}
        </div>
    );
}
```

(This switches the grid to a centered flex-wrap layout with explicit per-breakpoint widths matching the original grid's 1/2/4-column behavior, so 7 cards' incomplete last row centers under the row above instead of trailing off to the left with a visible gap.)

- [ ] **Step 3: Add an empty state to the recent-activity feed**

In `resources/js/Components/admin/DashboardRecentActivityList.jsx`, add a conditional before the `.map(...)`:

```jsx
            <CardContent className="space-y-4">
                {activity.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
                {activity.map((entry) => (
```

(Only this one line is added — the rest of the file, including the closing of the map and the component, stays exactly as-is.)

- [ ] **Step 4: Fix the chart tooltip hiding a zero value**

In `resources/js/Components/ui/chart.jsx`, find:

```jsx
                                                {item.value && (
```

Change to:

```jsx
                                                {item.value != null && (
```

- [ ] **Step 5: Verify**

1. Via curl or `php artisan tinker`: confirm `GET /admin/dashboard`'s `counts` prop still returns the same 7 keys with correct values as before this change (cross-check against live `::count()` calls per model, same as prior verification passes for this page).
2. `npm run build` — confirm it succeeds.
3. Confirm the build's rendered markup for the overview cards no longer uses a CSS Grid (`grid`) class — it should now use `flex flex-wrap justify-center`.
4. If a browser is available: collapse the dashboard's stat cards down to a fresh-install thought experiment isn't practical to simulate live without deleting real data, so this is a code-review-level check — confirm `DashboardRecentActivityList.jsx`'s empty-state line is present and syntactically correct (`activity.length === 0 && <p ...>`).

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Admin/DashboardController.php resources/js/Components/admin/DashboardOverviewCards.jsx resources/js/Components/admin/StatCard.jsx resources/js/Components/admin/DashboardRecentActivityList.jsx resources/js/Components/ui/chart.jsx
git commit -m "fix: consolidate dashboard resource list, add empty states, fix ragged grid and zero-value tooltip"
```

---

## Task 3: Earlier CRUD polish (image uploads, ordering, validation, save-bar layout)

**Files:**
- Modify: `resources/js/Components/admin/ImageUpload.jsx`
- Modify: `resources/js/Components/admin/PartnerForm.jsx`
- Modify: `resources/js/Components/admin/ProgramForm.jsx`
- Modify: `resources/js/Components/admin/TrainerForm.jsx`
- Modify: `resources/js/Components/admin/MembershipPlanForm.jsx`
- Modify: `app/Http/Controllers/Admin/FaqController.php`
- Modify: `app/Http/Controllers/Admin/TestimonialController.php`
- Modify: `app/Http/Controllers/Admin/ProgramController.php`
- Modify: `app/Http/Controllers/Admin/TrainerController.php`
- Modify: `resources/js/Pages/Admin/Programs/Index.jsx`
- Create: `database/migrations/2026_09_08_000003_backfill_null_home_description_on_programs_table.php`

**Interfaces:**
- Consumes: nothing new.
- Produces: `ImageUpload` gains an `id` prop (optional, passed through to its underlying `<input>`) — backward-compatible with any caller that doesn't pass one.

- [ ] **Step 1: Fix ImageUpload's stale-blob leak and overlapping-selection race**

Replace `resources/js/Components/admin/ImageUpload.jsx` in full:

```jsx
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function getXsrfToken() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export function ImageUpload({ id, value, onChange, uploadType, disabled = false, onUploadingChange }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);
    const objectUrlRef = useRef(null);
    const requestIdRef = useRef(0);

    function setUploadingState(next) {
        setUploading(next);
        onUploadingChange?.(next);
    }

    async function handleFile(file) {
        setError(null);
        const previousValue = value;
        const requestId = ++requestIdRef.current;

        // A new selection always supersedes whatever preview came before it —
        // revoke it immediately rather than waiting for its own upload to
        // finish (which may never happen if it's abandoned mid-flight).
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
        }
        const objectUrl = URL.createObjectURL(file);
        objectUrlRef.current = objectUrl;
        onChange(objectUrl);
        setUploadingState(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", uploadType);
            const response = await fetch("/admin/uploads", {
                method: "POST",
                body: formData,
                headers: {
                    "X-XSRF-TOKEN": getXsrfToken(),
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error("Upload failed. Please try again.");
            }
            const { url } = await response.json();
            // Only apply this result if no newer selection has started since —
            // otherwise an older, slower upload could clobber a newer one's
            // in-progress or already-finished result.
            if (requestIdRef.current === requestId) {
                onChange(url);
            }
        } catch (err) {
            if (requestIdRef.current === requestId) {
                setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
                onChange(previousValue);
            }
        } finally {
            if (objectUrlRef.current === objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrlRef.current = null;
            }
            if (requestIdRef.current === requestId) {
                setUploadingState(false);
            }
        }
    }

    function handleDrop(event) {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            void handleFile(file);
        }
    }

    return (
        <div className="space-y-2">
            <div
                onClick={disabled ? undefined : () => inputRef.current?.click()}
                onDragOver={disabled ? undefined : (e) => e.preventDefault()}
                onDrop={disabled ? undefined : handleDrop}
                className={cn(
                    "relative flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/30 text-sm text-muted-foreground",
                    !disabled && "cursor-pointer hover:bg-muted/50",
                    value && "border-solid p-0",
                )}
            >
                {value ? (
                    <img src={value} alt="" className="h-full w-full rounded-lg object-cover" />
                ) : disabled ? (
                    <span>No image</span>
                ) : (
                    <>
                        <ImagePlus className="size-6" />
                        <span>Click or drag an image here</span>
                    </>
                )}
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                        <Loader2 className="size-5 animate-spin" />
                    </div>
                )}
            </div>
            <input
                id={id}
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        void handleFile(file);
                    }
                }}
            />
            {error && (
                <p role="alert" className="text-sm text-destructive">
                    {error}
                </p>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Wire the `id` prop through from the 3 consuming forms so each `<Label>` is properly associated**

In `resources/js/Components/admin/PartnerForm.jsx`, find:

```jsx
                <Label htmlFor="logo_path">Logo</Label>
                <ImageUpload
                    value={data.logo_path}
```

Change to:

```jsx
                <Label htmlFor="logo_path">Logo</Label>
                <ImageUpload
                    id="logo_path"
                    value={data.logo_path}
```

In `resources/js/Components/admin/ProgramForm.jsx`, find:

```jsx
                <Label htmlFor="image_path">Image</Label>
                <ImageUpload
                    value={data.image_path}
```

Change to:

```jsx
                <Label htmlFor="image_path">Image</Label>
                <ImageUpload
                    id="image_path"
                    value={data.image_path}
```

In `resources/js/Components/admin/TrainerForm.jsx`, find the identical pattern and apply the identical change:

```jsx
                <Label htmlFor="image_path">Image</Label>
                <ImageUpload
                    id="image_path"
                    value={data.image_path}
```

- [ ] **Step 3: Fix the save bar overlapping the sidebar when collapsed/expanded**

In each of `resources/js/Components/admin/ProgramForm.jsx`, `resources/js/Components/admin/TrainerForm.jsx`, and `resources/js/Components/admin/MembershipPlanForm.jsx`, find:

```jsx
            <div className="fixed inset-x-0 bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4">
```

Change to:

```jsx
            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4">
```

(`fixed` positions relative to the whole browser viewport, ignoring the sidebar's width entirely — spanning edge-to-edge and overlapping the sidebar. `sticky` positions relative to the page's own content area, which is already correctly offset to the right of the sidebar, so dropping `inset-x-0` — no longer needed since `sticky` naturally spans its parent's width — and switching `fixed` to `sticky` confines the bar to the content pane where it belongs.)

- [ ] **Step 4: Scope FAQ/Testimonial sort-order allocation to the page(s) being assigned**

In `app/Http/Controllers/Admin/FaqController.php`, find `store()`:

```php
    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Faq::max('sort_order') + 1;

        Faq::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }
```

Change to:

```php
    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Faq::query()
            ->where(function ($query) use ($validated) {
                if ($validated['show_on_contact']) {
                    $query->orWhere('show_on_contact', true);
                }
                if ($validated['show_on_membership']) {
                    $query->orWhere('show_on_membership', true);
                }
            })
            ->max('sort_order') + 1;

        Faq::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }
```

In `app/Http/Controllers/Admin/TestimonialController.php`, find `store()`:

```php
    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Testimonial::max('sort_order') + 1;

        Testimonial::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }
```

Change to:

```php
    public function store(Request $request)
    {
        $validated = $this->validated($request);

        $nextOrder = (int) Testimonial::query()
            ->where(function ($query) use ($validated) {
                if ($validated['show_on_home']) {
                    $query->orWhere('show_on_home', true);
                }
                if ($validated['show_on_about']) {
                    $query->orWhere('show_on_about', true);
                }
            })
            ->max('sort_order') + 1;

        Testimonial::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }
```

(A new item now gets ordered after only the existing items it actually shares a page with, rather than after every FAQ/Testimonial regardless of which page it appears on. If a new item is checked for both pages, it's scoped against the union of both — the `orWhere` chain — since `max()` across a broader-but-still-relevant set is still correct.)

- [ ] **Step 5: Add max-length validation to the unbounded text fields**

In `app/Http/Controllers/Admin/FaqController.php`, find `'answer' => ['required', 'string'],` and change to `'answer' => ['required', 'string', 'max:2000'],`.

In `app/Http/Controllers/Admin/TestimonialController.php`, find `'quote' => ['required', 'string'],` and change to `'quote' => ['required', 'string', 'max:2000'],`.

In `app/Http/Controllers/Admin/TrainerController.php`, find `'bio' => ['required', 'string'],` and change to `'bio' => ['required', 'string', 'max:2000'],`.

In `app/Http/Controllers/Admin/ProgramController.php`, find:

```php
            'description' => ['required', 'string'],
            'home_description' => ['required', 'string'],
```

Change to:

```php
            'description' => ['required', 'string', 'max:5000'],
            'home_description' => ['required', 'string', 'max:1000'],
```

(These limits are deliberately generous — several paragraphs' worth — chosen only to catch accidental pastes or runaway input, not to constrain normal legitimate content.)

- [ ] **Step 6: Backfill the legacy Programs with a null `home_description`, and surface a clearer error if Duplicate ever fails validation again**

Create `database/migrations/2026_09_08_000003_backfill_null_home_description_on_programs_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('programs')
            ->whereNull('home_description')
            ->update(['home_description' => DB::raw('description')]);
    }

    public function down(): void
    {
        // Intentionally irreversible — there is no way to distinguish which
        // rows were backfilled by this migration from rows that always had
        // a matching description/home_description, so down() is a no-op.
    }
};
```

(This copies each affected row's existing `description` into `home_description` as a reasonable default — better than an empty string, and editable afterward by the Super Admin like any other field. Using `whereNull` means this migration is safe to run even if no rows currently qualify.)

In `resources/js/Pages/Admin/Programs/Index.jsx`, find `handleDuplicate`'s options:

```jsx
            {
                onSuccess: () => toast.success("Program created."),
                onError: () => toast.error("Something went wrong."),
```

Change to:

```jsx
            {
                onSuccess: () => toast.success("Program created."),
                onError: (errors) => toast.error(Object.values(errors)[0] ?? "Something went wrong."),
```

(This is defense-in-depth beyond the backfill above — if a future Duplicate ever fails validation for any reason, the toast will show the actual validation message instead of a generic one.)

- [ ] **Step 7: Verify**

1. `php artisan migrate` (in this task's own isolated worktree database — never `--fresh`) — confirm the new migration runs cleanly. If this worktree's seeded data has no null `home_description` rows to begin with, that's fine — the migration is a no-op backfill guarded by `whereNull`, and its correctness is what's being verified here, not the presence of real legacy data (that only exists in the real dev database). **Note for whoever finishes this branch:** this migration must also be run against the real dev database after merging, exactly like the auth-refactor plan's finishing step — that's where the actual 2 legacy null-`home_description` Programs live, and only there does this backfill have real rows to act on. Confirm via `php artisan tinker`, against the real dev DB, that `Program::whereNull('home_description')->count()` is `0` after that real-DB migration runs.
2. Via a real browser or curl (against whichever database has a row to test with — the real dev DB after finishing, or a manually-created null-`home_description` test row in the worktree if verifying earlier): confirm a Program with a null `home_description` now Duplicates successfully after this migration runs against its database.
3. `php artisan test` — confirm no regressions.
4. `npm run build` — confirm it succeeds.
5. Via curl: submit an FAQ/Testimonial marked for a page that already has existing items, and confirm its `sort_order` lands correctly after that page's existing items (not after some unrelated highest value from a different page).
6. Via curl: submit a `description`/`home_description`/`bio`/`quote`/`answer` value exceeding its new max length and confirm a 422 validation error.
7. If a browser is available: confirm the Save bar on a Program/Trainer/Membership Plan form no longer overlaps the sidebar at any window width, and confirm the image-upload label click now focuses the upload control in Partners/Programs/Trainers.

- [ ] **Step 8: Commit**

```bash
git add resources/js/Components/admin/ImageUpload.jsx resources/js/Components/admin/PartnerForm.jsx resources/js/Components/admin/ProgramForm.jsx resources/js/Components/admin/TrainerForm.jsx resources/js/Components/admin/MembershipPlanForm.jsx app/Http/Controllers/Admin/FaqController.php app/Http/Controllers/Admin/TestimonialController.php app/Http/Controllers/Admin/ProgramController.php app/Http/Controllers/Admin/TrainerController.php resources/js/Pages/Admin/Programs/Index.jsx database/migrations/2026_09_08_000003_backfill_null_home_description_on_programs_table.php
git commit -m "fix: close image-upload race, scope ordering per page, add length limits, fix save-bar overlap"
```

---

## Task 4: Full regression pass

**Files:** none (verification only).

**Interfaces:** none — this task consumes everything Tasks 1-3 built and produces nothing new.

- [ ] **Step 1: Full regression pass**

This plan touches Auth, Dashboard, and 6 different CRUD resources' forms — verify nothing regressed:

1. Log in normally (real password), log in via a freshly-issued temp password, and confirm the forced set-password screen still works end-to-end with the new stronger password rule in effect.
2. Confirm the Manage Admins screen (create/reset-access/deactivate/reactivate/remove) still works unchanged.
3. Confirm the Dashboard loads with correct counts, a working chart, and a populated recent-activity feed.
4. Spot-check every other admin page (Programs, Trainers, Membership Plans, Partners, Locations, Testimonials, FAQs, Site Settings, Social Links) still loads (200, correct Inertia component).
5. Confirm `php artisan test` passes in full.
6. Confirm `npm run build` succeeds.
7. Note any of the following as browser-only, not verifiable from a session without browser access, and flag for human confirmation: the Dashboard's centered ragged-row layout, the sidebar/save-bar visual fixes, the error page's appearance, and the temp-password dialog's checkmark-reset behavior across two consecutive generations.

- [ ] **Step 2: Clean up**

Confirm no test data was left behind in any resource touched during this pass, and that the real dev database's Program rows are exactly as expected after the Step 6 backfill (no unintended changes to any row that already had a `home_description`).
