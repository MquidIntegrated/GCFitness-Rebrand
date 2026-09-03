# GCFitness Admin Auth Implementation Plan (Phase 2, Plan 1 of 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Real Laravel session authentication for the GCFitness admin panel — login, logout, forgot/reset password — replacing the source app's mock localStorage-token auth, with the exact login/forgot-password/reset-password UI ported from the source app.

**Architecture:** Laravel's built-in `web` session guard, reusing the existing `users`/`password_reset_tokens`/`sessions` tables (already present from the Laravel scaffold, untouched by phase 1). No Breeze/Jetstream — a small hand-written `Admin\AuthController` plus Laravel's built-in `Password` broker for reset. Inertia-native throughout: pages receive data as props, forms use `@inertiajs/react`'s `useForm`, no JSON API layer.

**Tech Stack:** Laravel 12 session auth, Inertia.js v2, React 19, the shadcn/ui `Button`/`Input`/`Label` primitives (ported this plan, reused by every later phase-2 plan), Tailwind v4 (tokens already in place from phase 1).

**Spec:** `docs/superpowers/specs/2026-09-03-gcfitness-admin-cms-design.md`

## Global Constraints

- Single admin account, no roles, no 2FA (spec: "Auth" section) — the seeded admin user is the only account this plan creates.
- Login errors always show one fixed message ("Invalid email or password. Please try again.") regardless of the actual cause — never reveal whether an email exists.
- The forgot-password screen always shows the identical confirmation message regardless of whether the typed email matched an account — same email-enumeration protection, enforced server-side via `Password::sendResetLink` (which is already silent on a non-existent email) plus a fixed response message.
- The reset-password screen shows real, specific errors (e.g. an invalid/expired token) — there's no enumeration risk once someone already holds a valid-looking reset link.
- Inertia-native: no `routes/api.php`, no JSON API controllers, no `axios` admin client, no React Query, for this plan or any later phase-2 plan.
- Admin pages render with NO public site chrome (no `SiteNav`/`SiteFooter`/`Preloader` from phase 1's `SiteLayout`) — each admin page must opt out of the default Inertia layout.
- Dependency versions for every phase-2 npm package are pinned to the exact range the source app (`GC-Fitness-Rebrand/package.json`) declares — this plan's Task 1 installs the full set needed across all 5 phase-2 plans in one shot, not just this plan's own dependencies.

---

## Task 1: Sync phase-2 npm dependencies to the source app's exact versions

Installs every npm package the whole phase-2 admin CMS will need (not just auth) in one deliberate pass, pinned to the exact caret ranges the source app declares — closing off the version-drift failure mode from phase 1 (an unpinned `npm install lucide-react` grabbed a newer major version than the source used, silently dropping icons). Also corrects two packages phase 1 installed without an explicit pin (`tailwind-merge`, `tw-animate-css`), which drifted to slightly newer minor versions than the source declares.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: every npm package phase-2 plans 1-5 need, all at the source app's exact declared version range.

- [ ] **Step 1: Re-pin the two packages that drifted in phase 1**

In `package.json`, change:
```
"tailwind-merge": "^3.6.0",
```
to:
```
"tailwind-merge": "^3.5.0",
```
and change:
```
"tw-animate-css": "^1.4.0"
```
to:
```
"tw-animate-css": "^1.3.4"
```
(Leave `clsx` and `lucide-react` alone — both already match the source app's exact declared versions, `^2.1.1` and `^0.575.0` respectively.)

- [ ] **Step 2: Add every new phase-2 dependency at the source app's exact version**

Run this single command (all versions copied verbatim from `GC-Fitness-Rebrand/package.json`):

```bash
npm install --save-exact=false \
  "@dnd-kit/core@^6.3.1" \
  "@dnd-kit/sortable@^10.0.0" \
  "@dnd-kit/utilities@^3.2.2" \
  "@hookform/resolvers@^5.2.2" \
  "@radix-ui/react-accordion@^1.2.12" \
  "@radix-ui/react-alert-dialog@^1.1.15" \
  "@radix-ui/react-aspect-ratio@^1.1.8" \
  "@radix-ui/react-avatar@^1.1.11" \
  "@radix-ui/react-checkbox@^1.3.3" \
  "@radix-ui/react-collapsible@^1.1.12" \
  "@radix-ui/react-context-menu@^2.2.16" \
  "@radix-ui/react-dialog@^1.1.15" \
  "@radix-ui/react-dropdown-menu@^2.1.16" \
  "@radix-ui/react-hover-card@^1.1.15" \
  "@radix-ui/react-label@^2.1.8" \
  "@radix-ui/react-menubar@^1.1.16" \
  "@radix-ui/react-navigation-menu@^1.2.14" \
  "@radix-ui/react-popover@^1.1.15" \
  "@radix-ui/react-progress@^1.1.8" \
  "@radix-ui/react-radio-group@^1.3.8" \
  "@radix-ui/react-scroll-area@^1.2.10" \
  "@radix-ui/react-select@^2.2.6" \
  "@radix-ui/react-separator@^1.1.8" \
  "@radix-ui/react-slider@^1.3.6" \
  "@radix-ui/react-slot@^1.2.4" \
  "@radix-ui/react-switch@^1.2.6" \
  "@radix-ui/react-tabs@^1.1.13" \
  "@radix-ui/react-toggle@^1.1.10" \
  "@radix-ui/react-toggle-group@^1.1.11" \
  "@radix-ui/react-tooltip@^1.2.8" \
  "class-variance-authority@^0.7.1" \
  "cmdk@^1.1.1" \
  "date-fns@^4.1.0" \
  "embla-carousel-react@^8.6.0" \
  "input-otp@^1.4.2" \
  "react-day-picker@^9.14.0" \
  "react-hook-form@^7.71.2" \
  "react-resizable-panels@^4.6.5" \
  "recharts@^2.15.4" \
  "sonner@^2.0.7" \
  "vaul@^1.1.2" \
  "zod@^3.24.2"
```

- [ ] **Step 3: Re-install to apply the Step 1 re-pins**

Run: `npm install` (picks up the `tailwind-merge`/`tw-animate-css` range changes from Step 1)

- [ ] **Step 4: Verify every installed version matches the declared range, and the build still succeeds**

Run: `npm ls tailwind-merge tw-animate-css clsx lucide-react react-hook-form zod @radix-ui/react-slot recharts --depth=0`

Expected: no `npm error` about unmet ranges, and each listed package's installed version falls inside its `package.json` range (e.g. `tailwind-merge@3.5.x`, not `3.6.x`).

Run: `npm run build`

Expected: succeeds with no errors (nothing imports these new packages yet — this only checks the install itself didn't break anything).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: sync phase-2 npm dependencies to source app's exact versions"
```

---

## Task 2: Port the Button, Input, and Label shadcn/ui primitives

Every admin form across all 5 phase-2 plans uses these 3 components. Ports of `GC-Fitness-Rebrand/src/components/ui/{button,input,label}.tsx`, framework-agnostic — no logic changes beyond stripping TypeScript types. The color tokens they reference (`bg-primary`, `text-primary-foreground`, `bg-destructive`, `border-input`, `bg-accent`, `bg-secondary`, `ring-ring`, `bg-background`) already exist in `resources/css/app.css` from phase 1's Task 2 (the full source `styles.css` theme block was ported verbatim, including these).

**Files:**
- Create: `resources/js/Components/ui/button.jsx`
- Create: `resources/js/Components/ui/input.jsx`
- Create: `resources/js/Components/ui/label.jsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (phase 1, Task 4); `Slot` from `@radix-ui/react-slot`; `cva` from `class-variance-authority`; `LabelPrimitive` from `@radix-ui/react-label` (all installed in Task 1).
- Produces: `Button` (+ `buttonVariants`), `Input`, `Label` from `@/Components/ui/{button,input,label}` — consumed by Task 4/5's forms and every later phase-2 plan's admin forms.

- [ ] **Step 1: Port Button**

Create `resources/js/Components/ui/button.jsx`:

```jsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 2: Port Input**

Create `resources/js/Components/ui/input.jsx`:

```jsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (
        <input
            type={type}
            className={cn(
                "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className,
            )}
            ref={ref}
            {...props}
        />
    );
});
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 3: Port Label**

Create `resources/js/Components/ui/label.jsx`:

```jsx
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef(({ className, ...props }, ref) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 4: Verify**

Run: `npm run build`

Expected: succeeds (nothing renders these yet — Task 4 wires the first one in).

- [ ] **Step 5: Commit**

```bash
git add resources/js/Components/ui
git commit -m "feat: port Button, Input, Label shadcn/ui primitives"
```

---

## Task 3: Backend — AuthController, routes, password-reset URL customization, seeded admin user

Builds the entire server-side auth surface: session login/logout, Laravel's built-in password-reset broker (adapted so the reset link carries `token` + `email` in its query string even though the visible reset form never shows an email field — see Step 3's explanation), the `/admin` route group, and one seeded admin user.

**Files:**
- Create: `app/Http/Controllers/Admin/AuthController.php`
- Create: `app/Http/Controllers/Admin/DashboardController.php`
- Create: `database/seeders/AdminUserSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`
- Modify: `app/Providers/AppServiceProvider.php`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `App\Models\User` (Laravel scaffold, untouched).
- Produces: named routes `admin.login`, `admin.logout`, `admin.forgot-password`, `admin.password.reset`, `admin.dashboard`; Inertia components `Admin/Auth/Login`, `Admin/Auth/ForgotPassword`, `Admin/Auth/ResetPassword`, `Admin/Dashboard` (built in Tasks 4-6) each receiving the props documented in their controller action below.

- [ ] **Step 1: Create `AuthController`**

Create `app/Http/Controllers/Admin/AuthController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function showLogin()
    {
        return inertia('Admin/Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'Invalid email or password. Please try again.',
            ]);
        }

        $request->session()->regenerate();

        return redirect()->route('admin.dashboard');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }

    public function showForgotPassword()
    {
        return inertia('Admin/Auth/ForgotPassword');
    }

    public function sendResetLink(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        return back()->with('status', "If that email has an account, we've sent a link to reset the password.");
    }

    public function showResetPassword(Request $request)
    {
        return inertia('Admin/Auth/ResetPassword', [
            'token' => $request->query('token', ''),
            'email' => $request->query('email', ''),
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'password' => __($status),
            ]);
        }

        return redirect()->route('admin.login')->with('status', 'Your password has been reset. You can now sign in.');
    }
}
```

- [ ] **Step 2: Create the placeholder `DashboardController`**

The real dashboard (stats, activity, charts) is built in phase-2 Plan 5. For this plan, it only needs to exist so login has somewhere real to redirect to. Create `app/Http/Controllers/Admin/DashboardController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function index()
    {
        return inertia('Admin/Dashboard');
    }
}
```

- [ ] **Step 3: Customize the password-reset notification URL**

Laravel's default password-reset flow is keyed by an (email, token) pair — `Password::reset()` needs both to look up and verify the `password_reset_tokens` row. The source app's reset-password screen never shows an email field (only password + confirm), so the emailed link must carry the email invisibly in its query string alongside the token, and the reset page reads both from the URL without ever displaying the email to the visitor (Step 4 of Task 5 wires this into a hidden field). Customize the notification's URL builder in `app/Providers/AppServiceProvider.php`:

```php
<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $user, string $token) {
            return route('admin.password.reset', ['token' => $token, 'email' => $user->email]);
        });
    }
}
```

- [ ] **Step 4: Add the admin route group**

Replace the entire contents of `routes/web.php`:

```php
<?php

use App\Http\Controllers\AboutController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MembershipController;
use App\Http\Controllers\ProgramsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index']);
Route::get('/about', [AboutController::class, 'index']);
Route::get('/programs', [ProgramsController::class, 'index']);
Route::get('/membership', [MembershipController::class, 'index']);
Route::get('/contact', [ContactController::class, 'index']);

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('forgot-password', [AuthController::class, 'showForgotPassword'])->name('forgot-password');
    Route::post('forgot-password', [AuthController::class, 'sendResetLink']);
    Route::get('reset-password', [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    });
});
```

- [ ] **Step 5: Create the admin user seeder**

Create `database/seeders/AdminUserSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@gcfitness.club'],
            ['name' => 'GCFitness Admin', 'password' => Hash::make('password')]
        );
    }
}
```

`updateOrCreate` keyed on email means re-running `migrate:fresh --seed` (which every task in this plan does) never fails on a duplicate-email error and always leaves exactly one admin account with these known credentials for testing. This is a dev-seeded password (`password`) — flag to the user that it must be changed before any real deployment.

- [ ] **Step 6: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `AdminUserSeeder::class` to the existing `$this->call([...])` array (alongside the 9 phase-1 seeders — read the file first, don't overwrite the existing entries).

- [ ] **Step 7: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\User::where('email','admin@gcfitness.club')->exists() ? 'admin user exists' : 'MISSING';"`

Expected: `admin user exists`

Run: `php artisan route:list --path=admin`

Expected: lists all 8 routes from Step 4 (`admin.login` GET+POST, `admin.logout` POST, `admin.forgot-password` GET+POST, `admin.password.reset` GET, admin reset-password POST, `admin.dashboard` GET), with `admin.dashboard` showing the `auth` middleware.

- [ ] **Step 8: Commit**

```bash
git add app/Http/Controllers/Admin app/Providers/AppServiceProvider.php database/seeders routes/web.php
git commit -m "feat: add admin auth backend (session login, password reset, seeded admin user)"
```

---

## Task 4: Port the login page

Ports `GC-Fitness-Rebrand/src/components/admin/auth/auth-shell.tsx` and `login-form.tsx`, combined into one Inertia page (the source splits shell/form/route across 3 files because TanStack Router's file-based routing and the form's router-independent unit-testability both required it; Inertia's per-page component model doesn't need that split). Changes from source: no router — `useForm`'s `post` replaces the raw `fetch`-based `authApi.login` call; validation errors arrive as Inertia's `errors` prop instead of a caught exception's message; the "Remember me" checkbox is wired to `useForm`'s data instead of being an uncontrolled native checkbox.

**Files:**
- Create: `resources/js/Components/AuthShell.jsx`
- Create: `resources/js/Pages/Admin/Auth/Login.jsx`

**Interfaces:**
- Consumes: `Button`, `Input`, `Label` (Task 2); `admin.login` POST route (Task 3, path `/admin/login`).
- Produces: `AuthShell` from `@/Components/AuthShell` — a shared, self-contained layout consumed by this task's Login page and Task 5's ForgotPassword/ResetPassword pages (not by phase 1's public pages). The `/admin/login` page, rendered by `AuthController::showLogin`.

- [ ] **Step 1: Create the shared auth shell**

Port of `GC-Fitness-Rebrand/src/components/admin/auth/auth-shell.tsx`, no logic changes. Create `resources/js/Components/AuthShell.jsx`:

```jsx
export function AuthShell({ children }) {
    return (
        <div className="flex min-h-screen">
            <div className="relative hidden w-[40%] shrink-0 items-center justify-center overflow-hidden bg-brand lg:flex">
                <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
                <div className="relative text-center">
                    <div className="font-hero text-4xl uppercase tracking-widest text-white">
                        GC<span className="text-white/70">Fitness</span>
                    </div>
                    <p className="mt-3 text-sm text-white/80">Content Studio</p>
                </div>
            </div>
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">{children}</div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Create the login page**

Create `resources/js/Pages/Admin/Auth/Login.jsx`:

```jsx
import { Head, useForm } from "@inertiajs/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { AuthShell } from "@/Components/AuthShell";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/login");
    }

    return (
        <AuthShell>
            <Head title="Sign In — GCFitness Admin" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Welcome back</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sign in to manage your GCFitness website.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        required
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData("remember", e.target.checked)}
                            className="size-4 rounded border-input"
                        />
                        Remember me
                    </label>
                    <a href="/admin/forgot-password" className="font-medium text-primary hover:underline">
                        Forgot password?
                    </a>
                </div>

                {errors.email && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.email}
                    </p>
                )}

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? "Signing in…" : "Sign in"}
                </Button>
            </form>
        </AuthShell>
    );
}

LoginPage.layout = (page) => page;

export default LoginPage;
```

`LoginPage.layout = (page) => page` opts this page out of `app.jsx`'s default `SiteLayout` wrapper (the public nav/footer/preloader) — `AuthShell` here is a full self-contained layout, matching the source app's admin routes never wearing the marketing site's chrome.

- [ ] **Step 3: Verify**

Start `php artisan serve` and `npm run dev`. Visit `/admin/login` via curl and confirm HTTP 200 with `"component":"Admin/Auth/Login"` in the Inertia payload.

Then submit the form with the seeded credentials (`admin@gcfitness.club` / `password`) — either in a browser, or via curl reproducing the POST with a CSRF token (fetch `/admin/login` first to get the XSRF cookie, then POST `/admin/login` with `email`, `password`, and the `X-XSRF-TOKEN` header). Confirm the response redirects to `/admin/dashboard` with HTTP 200 there.

Then verify a wrong password: submit with an incorrect password and confirm the response is a redirect back to `/admin/login` with a validation error for `email` (check `storage/logs/laravel.log` shows no fatal errors, and re-fetching `/admin/login` shows the Inertia `errors` prop populated).

- [ ] **Step 4: Commit**

```bash
git add resources/js/Components/AuthShell.jsx resources/js/Pages/Admin/Auth/Login.jsx
git commit -m "feat: port admin login page"
```

---

## Task 5: Port the forgot-password and reset-password pages

Ports `forgot-password-form.tsx` and `reset-password-form.tsx`, each combined with `AuthShell` into one page per the same reasoning as Task 4. The reset-password page reads `token` and `email` from the URL query string (both present in the link Task 3's `ResetPassword::createUrlUsing` customization builds) and submits them as hidden form fields — the visible form still only shows password + confirm password, exactly matching the source app's screen.

**Files:**
- Create: `resources/js/Pages/Admin/Auth/ForgotPassword.jsx`
- Create: `resources/js/Pages/Admin/Auth/ResetPassword.jsx`

**Interfaces:**
- Consumes: `AuthShell` from `@/Components/AuthShell` (Task 4); `Button`, `Input`, `Label` (Task 2); `admin.forgot-password`/`admin.password.reset` POST routes (Task 3).
- Produces: the `/admin/forgot-password` and `/admin/reset-password` pages.

- [ ] **Step 1: Create the forgot-password page**

Create `resources/js/Pages/Admin/Auth/ForgotPassword.jsx`:

```jsx
import { Head, useForm, usePage } from "@inertiajs/react";
import { AuthShell } from "@/Components/AuthShell";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function ForgotPasswordPage() {
    const { status } = usePage().props;
    const { data, setData, post, processing } = useForm({ email: "" });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/forgot-password");
    }

    if (status) {
        return (
            <AuthShell>
                <Head title="Check Your Email — GCFitness Admin" />
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold">Check your email</h1>
                    <p className="text-sm text-muted-foreground">{status}</p>
                    <a href="/admin/login" className="inline-block pt-4 text-sm font-medium text-primary hover:underline">
                        Back to sign in
                    </a>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <Head title="Forgot Password — GCFitness Admin" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Forgot your password?</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Enter your email address and we'll send instructions to reset your password.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        required
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? "Sending…" : "Send reset link"}
                </Button>

                <a href="/admin/login" className="block text-center text-sm font-medium text-primary hover:underline">
                    Back to sign in
                </a>
            </form>
        </AuthShell>
    );
}

ForgotPasswordPage.layout = (page) => page;

export default ForgotPasswordPage;
```

This reads `status` from Inertia's shared page props (`AuthController::sendResetLink` sets it via `back()->with('status', ...)`) rather than local component state, since the confirmation message now comes from the server's redirect-back instead of a client-side try/catch.

- [ ] **Step 2: Create the reset-password page**

Create `resources/js/Pages/Admin/Auth/ResetPassword.jsx`:

```jsx
import { Head, useForm } from "@inertiajs/react";
import { AuthShell } from "@/Components/AuthShell";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function ResetPasswordPage({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: "",
        password_confirmation: "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        if (data.password !== data.password_confirmation) {
            return;
        }
        post("/admin/reset-password");
    }

    const mismatch = data.password_confirmation.length > 0 && data.password !== data.password_confirmation;

    return (
        <AuthShell>
            <Head title="Reset Password — GCFitness Admin" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Reset your password</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Choose a new password below.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm password</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={data.password_confirmation}
                        onChange={(e) => setData("password_confirmation", e.target.value)}
                    />
                </div>

                {mismatch && (
                    <p role="alert" className="text-sm text-destructive">
                        Passwords do not match.
                    </p>
                )}
                {errors.password && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.password}
                    </p>
                )}

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? "Resetting…" : "Reset password"}
                </Button>
            </form>
        </AuthShell>
    );
}

ResetPasswordPage.layout = (page) => page;

export default ResetPasswordPage;
```

`token` and `email` arrive as page props from `AuthController::showResetPassword` (Task 3) and travel through `useForm`'s hidden `token`/`email` fields — the visible form never shows an email input, matching the source exactly, while still satisfying Laravel's `Password::reset()` need for both.

- [ ] **Step 3: Verify the full forgot → reset flow**

With `.env`'s `MAIL_MAILER=log` (already the case — see `.env`), a "sent" reset email is written to `storage/logs/laravel.log` instead of actually emailing anyone, which is exactly what makes this verifiable without a real mailbox.

1. Visit `/admin/forgot-password`, submit `admin@gcfitness.club`, confirm the page shows "Check your email".
2. Read `storage/logs/laravel.log` (`tail -n 60 storage/logs/laravel.log` or open the file) and find the logged reset email — it contains a URL like `http://.../admin/reset-password?token=...&email=admin%40gcfitness.club`. Extract that URL.
3. Visit that exact URL. Confirm the page renders the reset form (not an error) — this proves `token`/`email` correctly arrived as props.
4. Submit a new password (e.g. `newpassword123`) with a matching confirmation. Confirm it redirects to `/admin/login` with a "Your password has been reset" status message.
5. Log in with the NEW password at `/admin/login` and confirm it redirects to `/admin/dashboard` successfully.
6. Also verify the mismatch case: on the reset form, type two different passwords and confirm the "Passwords do not match." message appears and the form does not submit.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Admin/Auth/ForgotPassword.jsx resources/js/Pages/Admin/Auth/ResetPassword.jsx
git commit -m "feat: port admin forgot-password and reset-password pages"
```

---

## Task 6: Dashboard placeholder, logout wiring, and full end-to-end verification

Closes out this plan: a minimal (but real, working) dashboard page proving the whole login→protected-page→logout loop, and a full regression pass confirming the `auth` middleware actually blocks unauthenticated access.

**Files:**
- Create: `resources/js/Pages/Admin/Dashboard.jsx`

**Interfaces:**
- Consumes: `admin.logout` POST route (Task 3).
- Produces: the `/admin/dashboard` page. This is a placeholder — phase-2 Plan 5 replaces it with the real dashboard (stats, activity, charts).

- [ ] **Step 1: Create the placeholder dashboard page**

Create `resources/js/Pages/Admin/Dashboard.jsx`:

```jsx
import { Head, useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";

function DashboardPage() {
    const { post, processing } = useForm();

    function handleLogout(e) {
        e.preventDefault();
        post("/admin/logout");
    }

    return (
        <>
            <Head title="Dashboard — GCFitness Admin" />
            <div className="flex min-h-screen items-center justify-center bg-background px-6">
                <div className="w-full max-w-sm text-center">
                    <h1 className="text-2xl font-semibold">Welcome back</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Signed in successfully. The full dashboard (stats, activity, charts) and the
                        rest of the admin CMS are built in later phase-2 plans.
                    </p>
                    <form onSubmit={handleLogout} className="mt-6">
                        <Button type="submit" disabled={processing}>
                            {processing ? "Signing out…" : "Sign out"}
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}

DashboardPage.layout = (page) => page;

export default DashboardPage;
```

- [ ] **Step 2: Verify the `auth` middleware actually blocks unauthenticated access**

While logged out (no session — e.g. `curl` without cookies, or an incognito browser window), fetch `/admin/dashboard`. Confirm it redirects to `/admin/login` (HTTP 302, or Inertia's equivalent redirect response) rather than rendering the dashboard.

- [ ] **Step 3: Full end-to-end regression pass**

In a browser: visit `/admin/login`, sign in with `admin@gcfitness.club` / whatever password Task 5's verification left it as (or reseed via `php artisan migrate:fresh --seed` to reset it back to `password` first), confirm you land on `/admin/dashboard`, click "Sign out", confirm you're returned to `/admin/login`, and confirm visiting `/admin/dashboard` again now redirects back to login (proving the session was actually destroyed, not just the redirect).

- [ ] **Step 4: Commit**

```bash
git add resources/js/Pages/Admin/Dashboard.jsx
git commit -m "feat: add placeholder admin dashboard, complete auth loop"
```

---

## Plan Self-Review Notes

- **Spec coverage:** every "Auth" decision in the spec is covered — session auth reusing `users` (Task 3), no roles/2FA (single seeded user, no role column anywhere), Inertia-native (no API routes/controllers anywhere in this plan), source UI ported exactly (Tasks 4-5), the one deliberate deviation (hidden email field on reset, needed to satisfy Laravel's email-keyed password broker) is explained inline rather than silently introduced. The dependency-sync spec decision is covered by Task 1, scoped to the *entire* phase-2 dependency list (not just auth's) as the spec specifies.
- **Type/naming consistency:** `admin.login`/`admin.logout`/`admin.forgot-password`/`admin.password.reset`/`admin.dashboard` route names are used identically between Task 3's route definitions and Tasks 4-6's `redirect()->route(...)` calls and page `post(...)` URLs. `LoginPage`/`ForgotPasswordPage`/`ResetPasswordPage`/`DashboardPage` all set `.layout = (page) => page` consistently, matching the Global Constraint that admin pages carry no public site chrome.
- **No placeholders:** every task's code blocks are complete, runnable files.
