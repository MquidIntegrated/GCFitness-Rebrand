# Admin Role-Based Auth & One-Time Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single-admin, email-based password-reset system with a two-role admin system (Super Admin / Admin) where account creation and password recovery both happen through a Super-Admin-issued one-time temporary password — no email involved anywhere.

**Architecture:** Two roles stored as a plain `role` column on the existing `users` table (no new package, no new tables beyond dropping the now-unused `password_reset_tokens`). A single shared mechanism — `User::issueTemporaryPassword()` — powers both account creation and password reset; logging in with either the real password or a valid, unexpired temp password is accepted, and a `must_change_password` flag forces a "set new password" screen before anything else works. A Super-Admin-only "Manage Admins" area creates/resets/deactivates/reactivates/removes Admin accounts; the one permanent Super Admin account is protected from all of those actions at the server layer, not just hidden in the UI.

**Tech Stack:** Laravel 12, Inertia.js v2, React 19, existing UI primitives (`Sheet`, `AlertDialog`, `Badge`, `DropdownMenu`) plus one newly-ported primitive (`Dialog`, for the one-time temp-password reveal) — `@radix-ui/react-dialog` is already an installed dependency.

**Spec:** `docs/superpowers/specs/2026-09-08-admin-role-based-auth-design.md`

## Global Constraints

- No new Composer packages (no Spatie or similar) — role check is a plain `role` string column comparison.
- No new database tables beyond dropping `password_reset_tokens` — everything else lives on the existing `users` table.
- Inertia-native throughout: controllers use `inertia()`/`redirect()`/`back()`, no JSON API.
- The one permanent Super Admin account (`admin@gcfitness.club`) can never be deactivated, reactivated (n/a), or removed, and there is no route or UI path anywhere that creates a second Super Admin.
- Temp passwords expire exactly 1 hour after being issued; issuing a new one for the same account immediately invalidates any prior unused one.
- Deactivating an account kills any of its live sessions immediately (not just on next login attempt), since `SESSION_DRIVER=database`.
- Login's failure message stays the single generic "Invalid email or password. Please try again." for every failure case (wrong password, invalid/expired temp password, deactivated account, unknown email) — none of them may leak which one it was.
- Reuse existing UI conventions rather than inventing new ones: `DeleteConfirmDialog` for Remove, the same Sheet-drawer-on-index shape already used by Partners/Locations for the Manage Admins list, the same inline validation-error style (`role="alert"`, per-field error text) used everywhere else in this app.

---

## Task 1: Data model — roles, account status, and the temporary-password mechanism

**Files:**
- Create: `database/migrations/2026_09_08_000001_add_role_and_auth_fields_to_users_table.php`
- Create: `database/migrations/2026_09_08_000002_drop_password_reset_tokens_table.php`
- Modify: `app/Models/User.php`
- Modify: `database/seeders/AdminUserSeeder.php`

**Interfaces:**
- Consumes: nothing new (extends the existing `users` table and `User` model).
- Produces: `User::isSuperAdmin(): bool`, `User::issueTemporaryPassword(): string` (returns the plaintext once), `User::hasValidTemporaryPassword(string $plainTextPassword): bool`, `User::clearTemporaryPassword(): void` — every later task's auth/account logic is built on these four methods and the `role`/`is_active`/`must_change_password` columns.

- [ ] **Step 1: Write the users-table migration**

Create `database/migrations/2026_09_08_000001_add_role_and_auth_fields_to_users_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('admin')->after('email');
            $table->boolean('is_active')->default(true)->after('role');
            $table->boolean('must_change_password')->default(false)->after('is_active');
            $table->string('temp_password_hash')->nullable()->after('password');
            $table->timestamp('temp_password_expires_at')->nullable()->after('temp_password_hash');
        });

        DB::table('users')->where('email', 'admin@gcfitness.club')->update(['role' => 'super_admin']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_active', 'must_change_password', 'temp_password_hash', 'temp_password_expires_at']);
        });
    }
};
```

- [ ] **Step 2: Write the password_reset_tokens drop migration**

Create `database/migrations/2026_09_08_000002_drop_password_reset_tokens_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('password_reset_tokens');
    }

    public function down(): void
    {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }
};
```

- [ ] **Step 3: Update the User model**

Replace `app/Models/User.php` in full:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'temp_password_hash',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'must_change_password' => 'boolean',
            'temp_password_expires_at' => 'datetime',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Generates a one-time temporary password, stores its hash separately
     * from the real password column, and returns the plaintext once for
     * display. Issuing a new one automatically invalidates any prior
     * unused one (simply overwritten).
     */
    public function issueTemporaryPassword(): string
    {
        $plainTextPassword = Str::password(12, symbols: false);

        $this->forceFill([
            'temp_password_hash' => Hash::make($plainTextPassword),
            'temp_password_expires_at' => now()->addHour(),
            'must_change_password' => true,
        ])->save();

        return $plainTextPassword;
    }

    public function hasValidTemporaryPassword(string $plainTextPassword): bool
    {
        return $this->temp_password_hash
            && $this->temp_password_expires_at?->isFuture()
            && Hash::check($plainTextPassword, $this->temp_password_hash);
    }

    public function clearTemporaryPassword(): void
    {
        $this->forceFill([
            'temp_password_hash' => null,
            'temp_password_expires_at' => null,
            'must_change_password' => false,
        ])->save();
    }
}
```

- [ ] **Step 4: Update the admin seeder**

In `database/seeders/AdminUserSeeder.php`, add `'role' => 'super_admin'` to the `updateOrCreate` call:

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
            ['name' => 'GCFitness Admin', 'password' => Hash::make('password'), 'role' => 'super_admin']
        );
    }
}
```

- [ ] **Step 5: Verify**

Run `php artisan migrate:fresh --seed`, then via `php artisan tinker`:
1. `App\Models\User::where('email', 'admin@gcfitness.club')->first()->role` → `"super_admin"`.
2. `Schema::hasTable('password_reset_tokens')` → `false`.
3. `$user = App\Models\User::first(); $plain = $user->issueTemporaryPassword(); $user->refresh();` — confirm `$user->must_change_password` is `true`, `$user->temp_password_hash` is set (and different from `$user->password`), `$user->hasValidTemporaryPassword($plain)` is `true`, and `$user->hasValidTemporaryPassword('wrong')` is `false`.
4. `$user->clearTemporaryPassword(); $user->refresh();` — confirm `must_change_password` is `false` again and `temp_password_hash` is `null`.

- [ ] **Step 6: Commit**

```bash
git add database/migrations/2026_09_08_000001_add_role_and_auth_fields_to_users_table.php database/migrations/2026_09_08_000002_drop_password_reset_tokens_table.php app/Models/User.php database/seeders/AdminUserSeeder.php
git commit -m "feat: add role, account status, and temporary-password fields to users"
```

---

## Task 2: Core auth flow — temp-password login, forced password change, remove the old email flow

**Files:**
- Modify: `app/Http/Controllers/Admin/AuthController.php`
- Create: `app/Http/Middleware/EnsureSuperAdmin.php`
- Create: `app/Http/Middleware/EnsurePasswordIsCurrent.php`
- Modify: `bootstrap/app.php`
- Modify: `routes/web.php`
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`
- Modify: `app/Providers/AppServiceProvider.php`
- Modify: `resources/js/Pages/Admin/Auth/Login.jsx`
- Create: `resources/js/Pages/Admin/Auth/SetPassword.jsx`
- Delete: `resources/js/Pages/Admin/Auth/ForgotPassword.jsx`
- Delete: `resources/js/Pages/Admin/Auth/ResetPassword.jsx`

**Interfaces:**
- Consumes: `User::isSuperAdmin()`, `User::hasValidTemporaryPassword()`, `User::clearTemporaryPassword()` (Task 1).
- Produces: routes `admin.password.set` (GET) and `admin.password.set.update` (POST); middleware aliases `role.super_admin` and `password.current`; shared Inertia prop `auth.user.role` — Task 3 and Task 4 both depend on all three.

- [ ] **Step 1: Replace AuthController**

Replace `app/Http/Controllers/Admin/AuthController.php` in full:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

        $user = User::where('email', $credentials['email'])->first();

        $authenticated = $user
            && $user->is_active
            && (Hash::check($credentials['password'], $user->password)
                || $user->hasValidTemporaryPassword($credentials['password']));

        if (! $authenticated) {
            throw ValidationException::withMessages([
                'email' => 'Invalid email or password. Please try again.',
            ]);
        }

        Auth::login($user, $request->boolean('remember'));
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

    public function showSetPassword()
    {
        return inertia('Admin/Auth/SetPassword');
    }

    public function setPassword(Request $request)
    {
        $validated = $request->validate([
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = $request->user();
        $user->forceFill(['password' => Hash::make($validated['password'])])->save();
        $user->clearTemporaryPassword();

        return redirect()->route('admin.dashboard');
    }
}
```

- [ ] **Step 2: Create the EnsureSuperAdmin middleware**

Create `app/Http/Middleware/EnsureSuperAdmin.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        return $next($request);
    }
}
```

- [ ] **Step 3: Create the EnsurePasswordIsCurrent middleware**

Create `app/Http/Middleware/EnsurePasswordIsCurrent.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsCurrent
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user
            && $user->must_change_password
            && ! $request->routeIs('admin.password.set', 'admin.password.set.update', 'admin.logout')
        ) {
            return redirect()->route('admin.password.set');
        }

        return $next($request);
    }
}
```

- [ ] **Step 4: Register the new middleware aliases**

In `bootstrap/app.php`, add the two new imports and alias entries:

```php
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\AuthenticateAdmin;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsurePasswordIsCurrent;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'auth.admin' => AuthenticateAdmin::class,
            'role.super_admin' => EnsureSuperAdmin::class,
            'password.current' => EnsurePasswordIsCurrent::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
```

- [ ] **Step 5: Update routes**

In `routes/web.php`, remove these 4 lines (the old email-based forgot/reset routes):

```php
    Route::get('forgot-password', [AuthController::class, 'showForgotPassword'])->name('forgot-password');
    Route::post('forgot-password', [AuthController::class, 'sendResetLink'])->middleware('throttle:5,1')->name('password.email');
    Route::get('reset-password', [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->name('password.update');
```

Change this line:

```php
    Route::middleware('auth.admin')->group(function () {
```

to:

```php
    Route::middleware(['auth.admin', 'password.current'])->group(function () {
```

Then add these 2 lines as the first two routes inside that group (right before the `dashboard` route):

```php
        Route::get('set-password', [AuthController::class, 'showSetPassword'])->name('password.set');
        Route::post('set-password', [AuthController::class, 'setPassword'])->name('password.set.update');
```

- [ ] **Step 6: Share the user's role globally**

In `app/Http/Middleware/HandleInertiaRequests.php`, change:

```php
            'auth' => fn () => [
                'user' => $request->user() ? ['name' => $request->user()->name] : null,
            ],
```

to:

```php
            'auth' => fn () => [
                'user' => $request->user() ? ['name' => $request->user()->name, 'role' => $request->user()->role] : null,
            ],
```

- [ ] **Step 7: Clean up AppServiceProvider**

Replace `app/Providers/AppServiceProvider.php` in full (removing the now-meaningless `ResetPassword::createUrlUsing` override, since nothing calls the password broker anymore):

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        //
    }
}
```

- [ ] **Step 8: Remove the "Forgot password?" link from Login.jsx**

In `resources/js/Pages/Admin/Auth/Login.jsx`, replace:

```jsx
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
```

with:

```jsx
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData("remember", e.target.checked)}
                        className="size-4 rounded border-input"
                    />
                    Remember me
                </label>
```

- [ ] **Step 9: Create the SetPassword page**

Create `resources/js/Pages/Admin/Auth/SetPassword.jsx`:

```jsx
import { Head, useForm } from "@inertiajs/react";
import { AuthShell } from "@/Components/AuthShell";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function SetPasswordPage() {
    const { data, setData, post, processing, errors } = useForm({
        password: "",
        password_confirmation: "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/set-password");
    }

    return (
        <AuthShell>
            <Head title="Set New Password — GCFitness Admin" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Set a new password</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        You're signing in with a temporary password. Choose a permanent password to continue.
                    </p>
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

                {errors.password && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.password}
                    </p>
                )}

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? "Saving…" : "Set password and continue"}
                </Button>
            </form>
        </AuthShell>
    );
}

SetPasswordPage.layout = (page) => page;

export default SetPasswordPage;
```

- [ ] **Step 10: Delete the old email-flow pages**

```bash
git rm resources/js/Pages/Admin/Auth/ForgotPassword.jsx resources/js/Pages/Admin/Auth/ResetPassword.jsx
```

- [ ] **Step 11: Verify**

Log in via the established curl cookie-jar+XSRF pattern, then:
1. `GET /admin/forgot-password` and `GET /admin/reset-password` — confirm both now 404.
2. Log in as `admin@gcfitness.club` / `password` — confirm it still works and reaches `/admin/dashboard` (this user's `must_change_password` is `false`, so `password.current` doesn't intercept).
3. Log in with a wrong password — confirm the same generic "Invalid email or password" message as before.
4. Via `php artisan tinker`: `$user = App\Models\User::where('email', 'admin@gcfitness.club')->first(); $plain = $user->issueTemporaryPassword();` — then log in via curl with that plaintext password. Confirm the response redirects to `/admin/set-password`, not `/admin/dashboard`.
5. While still authenticated as that temp-password session, `GET /admin/dashboard` directly — confirm it redirects to `/admin/set-password` (the `password.current` middleware intercepting).
6. `POST /admin/set-password` with a new `password`/`password_confirmation` — confirm it redirects to `/admin/dashboard`, and a subsequent `GET /admin/dashboard` now succeeds (200) without redirecting.
7. Via tinker, confirm `must_change_password` is now `false` and `temp_password_hash` is `null` for that user, then restore its real password back to `Hash::make('password')` and set `role` back to `super_admin` if it drifted (it shouldn't have) — leave the seeded admin exactly as it started.
8. `npm run build` — confirm it succeeds.
9. `php artisan test` — confirm it still passes.

- [ ] **Step 12: Commit**

```bash
git add app/Http/Controllers/Admin/AuthController.php app/Http/Middleware/EnsureSuperAdmin.php app/Http/Middleware/EnsurePasswordIsCurrent.php bootstrap/app.php routes/web.php app/Http/Middleware/HandleInertiaRequests.php app/Providers/AppServiceProvider.php resources/js/Pages/Admin/Auth/Login.jsx resources/js/Pages/Admin/Auth/SetPassword.jsx
git commit -m "feat: replace email password reset with temp-password login and forced password change"
```

---

## Task 3: Manage Admins — create, reset access, deactivate, reactivate, remove

**Files:**
- Create: `app/Http/Controllers/Admin/AdminAccountController.php`
- Modify: `routes/web.php`
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`
- Create: `resources/js/Components/ui/dialog.jsx`
- Create: `resources/js/Components/admin/AdminAccountList.jsx`
- Create: `resources/js/Components/admin/AdminAccountForm.jsx`
- Create: `resources/js/Components/admin/TempPasswordDialog.jsx`
- Create: `resources/js/Pages/Admin/ManageAdmins/Index.jsx`
- Modify: `resources/js/Components/admin/adminNavItems.js`
- Modify: `resources/js/Components/admin/AdminShell.jsx`
- Modify: `resources/js/Components/admin/breadcrumbSegments.js`

**Interfaces:**
- Consumes: `User::isSuperAdmin()`, `User::issueTemporaryPassword()` (Task 1); `role.super_admin` middleware, `password.current` middleware group (Task 2); `DeleteConfirmDialog` (existing).
- Produces: routes `admin.admins.index/store/reset-access/deactivate/reactivate/destroy`; shared Inertia prop `flash.tempPassword`.

- [ ] **Step 1: Port the Dialog UI primitive**

Create `resources/js/Components/ui/dialog.jsx`:

```jsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className,
        )}
        {...props}
    />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
                className,
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
    <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};
```

- [ ] **Step 2: Create the controller**

Create `app/Http/Controllers/Admin/AdminAccountController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminAccountController extends Controller
{
    public function index()
    {
        return inertia('Admin/ManageAdmins/Index', [
            'admins' => User::orderBy('name')->get(['id', 'name', 'email', 'role', 'is_active']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        ]);

        $admin = User::create($validated + [
            'password' => Hash::make(Str::random(32)),
            'role' => 'admin',
        ]);

        $tempPassword = $admin->issueTemporaryPassword();

        return back()->with('tempPassword', $tempPassword);
    }

    public function resetAccess(User $admin)
    {
        abort_if($admin->isSuperAdmin(), 403);

        $tempPassword = $admin->issueTemporaryPassword();

        return back()->with('tempPassword', $tempPassword);
    }

    public function deactivate(User $admin)
    {
        abort_if($admin->isSuperAdmin(), 403);

        $admin->update(['is_active' => false]);

        DB::table('sessions')->where('user_id', $admin->id)->delete();

        return back();
    }

    public function reactivate(User $admin)
    {
        abort_if($admin->isSuperAdmin(), 403);

        $admin->update(['is_active' => true]);

        return back();
    }

    public function destroy(User $admin)
    {
        abort_if($admin->isSuperAdmin(), 403);

        $admin->delete();

        return back();
    }
}
```

- [ ] **Step 3: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\AdminAccountController;` to the imports, and add this block inside the existing `['auth.admin', 'password.current']` group, right after the `set-password` routes added in Task 2:

```php
        Route::middleware('role.super_admin')->group(function () {
            Route::get('admins', [AdminAccountController::class, 'index'])->name('admins.index');
            Route::post('admins', [AdminAccountController::class, 'store'])->name('admins.store');
            Route::post('admins/{admin}/reset-access', [AdminAccountController::class, 'resetAccess'])->name('admins.reset-access');
            Route::post('admins/{admin}/deactivate', [AdminAccountController::class, 'deactivate'])->name('admins.deactivate');
            Route::post('admins/{admin}/reactivate', [AdminAccountController::class, 'reactivate'])->name('admins.reactivate');
            Route::delete('admins/{admin}', [AdminAccountController::class, 'destroy'])->name('admins.destroy');
        });
```

- [ ] **Step 4: Share the generated temp password once**

In `app/Http/Middleware/HandleInertiaRequests.php`, change:

```php
            'flash' => [
                'message' => fn() => $request->session()->get('message')
            ],
```

to:

```php
            'flash' => [
                'message' => fn() => $request->session()->get('message'),
                'tempPassword' => fn() => $request->session()->get('tempPassword'),
            ],
```

- [ ] **Step 5: Create the account list component**

Create `resources/js/Components/admin/AdminAccountList.jsx`:

```jsx
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function AdminAccountList({ admins, onResetAccess, onDeactivate, onReactivate, onDeleteRequest }) {
    return (
        <div className="space-y-3">
            {admins.map((admin) => (
                <div key={admin.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{admin.name}</span>
                            {admin.role === "super_admin" && <Badge>Super Admin</Badge>}
                            {!admin.is_active && <Badge variant="outline">Deactivated</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                    {admin.role !== "super_admin" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label={`Actions for ${admin.name}`}>
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onResetAccess(admin)}>Reset access</DropdownMenuItem>
                                {admin.is_active ? (
                                    <DropdownMenuItem onClick={() => onDeactivate(admin)}>Deactivate</DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => onReactivate(admin)}>Reactivate</DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => onDeleteRequest(admin)} className="text-destructive">
                                    Remove
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            ))}
        </div>
    );
}
```

- [ ] **Step 6: Create the create-admin form**

Create `resources/js/Components/admin/AdminAccountForm.jsx`:

```jsx
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export function AdminAccountForm({ onCancel, onSaved }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/admins", { onSuccess: onSaved });
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
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} />
                {errors.email && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.email}
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? "Creating…" : "Create admin"}
                </Button>
            </div>
        </form>
    );
}
```

- [ ] **Step 7: Create the temp-password reveal dialog**

Create `resources/js/Components/admin/TempPasswordDialog.jsx`:

```jsx
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/Components/ui/dialog";

export function TempPasswordDialog({ password, onOpenChange }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        await navigator.clipboard.writeText(password);
        setCopied(true);
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

- [ ] **Step 8: Build the Manage Admins index page**

Create `resources/js/Pages/Admin/ManageAdmins/Index.jsx`:

```jsx
import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { AdminAccountForm } from "@/Components/admin/AdminAccountForm";
import { AdminAccountList } from "@/Components/admin/AdminAccountList";
import { TempPasswordDialog } from "@/Components/admin/TempPasswordDialog";
import AdminLayout from "@/Layouts/AdminLayout";

function ManageAdminsPage({ admins }) {
    const { flash } = usePage().props;
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [tempPassword, setTempPassword] = useState(null);

    useEffect(() => {
        if (flash?.tempPassword) {
            setTempPassword(flash.tempPassword);
        }
    }, [flash?.tempPassword]);

    function handleResetAccess(admin) {
        router.post(`/admin/admins/${admin.id}/reset-access`);
    }

    function handleDeactivate(admin) {
        router.post(
            `/admin/admins/${admin.id}/deactivate`,
            {},
            { onSuccess: () => toast.success(`${admin.name} deactivated.`) },
        );
    }

    function handleReactivate(admin) {
        router.post(
            `/admin/admins/${admin.id}/reactivate`,
            {},
            { onSuccess: () => toast.success(`${admin.name} reactivated.`) },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/admins/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Admin removed."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Manage Admins — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Manage Admins</h1>
                    <Button onClick={() => setCreating(true)}>Add admin</Button>
                </div>

                <AdminAccountList
                    admins={admins}
                    onResetAccess={handleResetAccess}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={creating} onOpenChange={setCreating}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Add admin</SheetTitle>
                        </SheetHeader>
                        <AdminAccountForm onCancel={() => setCreating(false)} onSaved={() => setCreating(false)} />
                    </SheetContent>
                </Sheet>

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.name ?? ""}
                    onConfirm={handleConfirmDelete}
                />

                <TempPasswordDialog password={tempPassword} onOpenChange={(open) => !open && setTempPassword(null)} />
            </div>
        </>
    );
}

ManageAdminsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ManageAdminsPage;
```

- [ ] **Step 9: Add the role-gated sidebar entry**

In `resources/js/Components/admin/adminNavItems.js`, add a `ShieldCheck` icon import and a new exported array:

```js
import { Dumbbell, Users, CreditCard, MessageSquareQuote, HelpCircle, MapPin, Handshake, Settings, Share2, ShieldCheck } from "lucide-react";

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

export const SUPER_ADMIN_NAV_ITEMS = [
    { to: "/admin/admins", label: "Manage Admins", icon: ShieldCheck },
];
```

In `resources/js/Components/admin/AdminShell.jsx`, add `SUPER_ADMIN_NAV_ITEMS` to the existing import line (`import { CONTENT_NAV_ITEMS, SITE_INFO_NAV_ITEMS, SUPER_ADMIN_NAV_ITEMS } from "./adminNavItems";`), and add a new conditionally-rendered group right after the "Site info" `SidebarGroup` closes (i.e. immediately before `</SidebarContent>`):

```jsx
                    {props.auth?.user?.role === "super_admin" && (
                        <SidebarGroup>
                            <SidebarGroupLabel>Administration</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {SUPER_ADMIN_NAV_ITEMS.map((item) => (
                                        <SidebarMenuItem key={item.to}>
                                            <SidebarMenuButton asChild isActive={pathname.startsWith(item.to)}>
                                                <Link href={item.to}>
                                                    <item.icon />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )}
```

- [ ] **Step 10: Update breadcrumbs**

In `resources/js/Components/admin/breadcrumbSegments.js`, change:

```js
import { CONTENT_NAV_ITEMS, SITE_INFO_NAV_ITEMS } from "./adminNavItems";
```

to:

```js
import { CONTENT_NAV_ITEMS, SITE_INFO_NAV_ITEMS, SUPER_ADMIN_NAV_ITEMS } from "./adminNavItems";
```

and:

```js
const ALL_NAV_ITEMS = [...CONTENT_NAV_ITEMS, ...SITE_INFO_NAV_ITEMS];
```

to:

```js
const ALL_NAV_ITEMS = [...CONTENT_NAV_ITEMS, ...SITE_INFO_NAV_ITEMS, ...SUPER_ADMIN_NAV_ITEMS];
```

- [ ] **Step 11: Verify**

Log in as the Super Admin via curl, then:
1. `GET /admin/admins` — confirm HTTP 200, `"component":"Admin/ManageAdmins/Index"`, `admins` includes the seeded Super Admin (`role: "super_admin"`).
2. `POST /admin/admins` with `name=Test Admin&email=test-admin@example.com` — confirm redirect, then re-fetch and confirm the new row (`role: "admin"`, `is_active: true`) appears, and that the response's flashed `tempPassword` is present and non-empty on the immediate next request.
3. `POST /admin/admins/{id}/reset-access` on that new admin — confirm a new `tempPassword` is flashed, different from the first one.
4. `POST /admin/admins/{id}/deactivate` — confirm `is_active` becomes `false` via a re-fetch of the index.
5. `POST /admin/admins/{id}/reactivate` — confirm `is_active` becomes `true` again.
6. `DELETE /admin/admins/{id}` — confirm the row is gone.
7. Attempt each of `reset-access`/`deactivate`/`reactivate`/`destroy` against the Super Admin's own `{id}` — confirm every one returns `403`.
8. Log in as a plain `admin`-role user (create one via the flow above, complete its forced password-set) and confirm `GET /admin/admins` returns `403` for them.
9. `npm run build` — confirm it succeeds (first real compile check of `@radix-ui/react-dialog` usage via the new `dialog.jsx`).

- [ ] **Step 12: Commit**

```bash
git add app/Http/Controllers/Admin/AdminAccountController.php routes/web.php app/Http/Middleware/HandleInertiaRequests.php resources/js/Components/ui/dialog.jsx resources/js/Components/admin/AdminAccountList.jsx resources/js/Components/admin/AdminAccountForm.jsx resources/js/Components/admin/TempPasswordDialog.jsx resources/js/Pages/Admin/ManageAdmins/Index.jsx resources/js/Components/admin/adminNavItems.js resources/js/Components/admin/AdminShell.jsx resources/js/Components/admin/breadcrumbSegments.js
git commit -m "feat: add Manage Admins (create, reset access, deactivate, reactivate, remove)"
```

---

## Task 4: Self-service password change

**Files:**
- Create: `app/Http/Controllers/Admin/AccountController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Pages/Admin/Account/ChangePassword.jsx`
- Modify: `resources/js/Components/admin/AdminShell.jsx`

**Interfaces:**
- Consumes: `password.current`/`auth.admin` middleware group (Task 2).
- Produces: routes `admin.account.password.edit` (GET) and `admin.account.password.update` (POST).

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/AccountController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    public function showChangePassword()
    {
        return inertia('Admin/Account/ChangePassword');
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Your current password is incorrect.',
            ]);
        }

        $user->forceFill(['password' => Hash::make($validated['password'])])->save();

        return back()->with('message', 'Your password has been updated.');
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\AccountController;` to the imports, and add these 2 lines inside the `['auth.admin', 'password.current']` group, right after the `role.super_admin` group block added in Task 3 (i.e. right before the `dashboard` route):

```php
        Route::get('account/password', [AccountController::class, 'showChangePassword'])->name('account.password.edit');
        Route::post('account/password', [AccountController::class, 'changePassword'])->name('account.password.update');
```

- [ ] **Step 3: Build the Change Password page**

Create `resources/js/Pages/Admin/Account/ChangePassword.jsx`:

```jsx
import { Head, useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function ChangePasswordPage() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/account/password", { onSuccess: () => reset() });
    }

    return (
        <>
            <Head title="Change Password — GCFitness Admin" />
            <div className="max-w-sm space-y-6">
                <h1 className="text-2xl font-semibold">Change password</h1>

                {flash?.message && <p className="text-sm text-primary">{flash.message}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current_password">Current password</Label>
                        <Input
                            id="current_password"
                            type="password"
                            autoComplete="current-password"
                            value={data.current_password}
                            onChange={(e) => setData("current_password", e.target.value)}
                        />
                        {errors.current_password && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.current_password}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">New password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                        />
                        {errors.password && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">Confirm new password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData("password_confirmation", e.target.value)}
                        />
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing ? "Saving…" : "Update password"}
                    </Button>
                </form>
            </div>
        </>
    );
}

ChangePasswordPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ChangePasswordPage;
```

- [ ] **Step 4: Add it to the account dropdown menu**

In `resources/js/Components/admin/AdminShell.jsx`, change the icon import line:

```jsx
import { LayoutDashboard, Sun, Moon, LogOut, ExternalLink } from "lucide-react";
```

to:

```jsx
import { LayoutDashboard, Sun, Moon, LogOut, ExternalLink, KeyRound } from "lucide-react";
```

Then replace:

```jsx
                        <DropdownMenuContent side="top" align="start" className="w-56">
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 size-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
```

with:

```jsx
                        <DropdownMenuContent side="top" align="start" className="w-56">
                            <DropdownMenuItem asChild>
                                <Link href="/admin/account/password">
                                    <KeyRound className="mr-2 size-4" />
                                    Change password
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 size-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
```

- [ ] **Step 5: Verify**

Log in via curl, then:
1. `GET /admin/account/password` — confirm HTTP 200, `"component":"Admin/Account/ChangePassword"`.
2. `POST /admin/account/password` with the wrong `current_password` — confirm a validation error on `current_password`, and that the real password is unchanged (re-login with the old password still works).
3. `POST /admin/account/password` with the correct current password and a new one — confirm success, then confirm logging in with the OLD password now fails and the NEW one succeeds. Afterward, set the password back to `Hash::make('password')` via tinker so the seeded admin's credentials remain as documented.
4. `npm run build` — confirm it succeeds.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Admin/AccountController.php routes/web.php resources/js/Pages/Admin/Account/ChangePassword.jsx resources/js/Components/admin/AdminShell.jsx
git commit -m "feat: add self-service password change"
```

---

## Task 5: Full manual regression pass

This plan changes schema (new columns, a dropped table), so this task also covers the real-dev-DB migration step at finish time. No new code — verification only.

**Files:** none.

**Interfaces:** none — consumes everything Tasks 1-4 built.

- [ ] **Step 1: End-to-end regression pass**

Log in via curl (or a real browser session if available):

1. **Full lifecycle for a new Admin**: create one via `/admin/admins`, capture the flashed temp password, log in with it, confirm forced redirect to `/admin/set-password`, set a real password, confirm subsequent logins work with the real password and reach `/admin/dashboard` directly.
2. **Reset access**: as Super Admin, reset that admin's access. Resetting access never touches the real `password` column, only issues a new temp credential — confirm BOTH still work as separate valid logins: the admin's existing real password logs them straight into `/admin/dashboard` as normal, and the newly-issued temp password also logs them in but forces `/admin/set-password` again (matching the spec's "supplementary access, not a replacement" design).
3. **Deactivate mid-session**: log in as that admin in one curl session (keep its cookie jar), then — using a separate Super Admin cookie jar — deactivate that admin. Confirm the *already-logged-in* session's next request (e.g. `GET /admin/dashboard` using its original cookie jar) no longer works (redirected to login), not just that a fresh login attempt fails.
4. **Reactivate**: confirm the same admin can log in again afterward with their existing real password.
5. **Remove**: delete that admin; confirm `GET /admin/admins` no longer lists them, and that logging in with their old credentials now fails with the same generic message as an unknown email.
6. **Super Admin protection**: confirm `reset-access`/`deactivate`/`reactivate`/`destroy` against the Super Admin's own id all return `403`, and that a plain Admin hitting any `/admin/admins*` route also gets `403`.
7. **Self-service password change**: as a plain Admin, change your own password (wrong current password rejected, correct one accepted); confirm the Super Admin cannot see or derive that password anywhere (no endpoint returns a plaintext or hash for any account's real password).
8. **Old email flow fully gone**: confirm `/admin/forgot-password` and `/admin/reset-password` both 404.
9. **No regressions elsewhere**: spot-check that every other existing admin page (Dashboard, Programs, Trainers, Membership Plans, Partners, Locations, Testimonials, FAQs, Site Settings, Social Links) still returns 200 with its expected Inertia component name for the Super Admin.
10. `npm run build` and `php artisan test` — both succeed.

Record the outcome of each check; do not mark this task complete until every curl/artisan-verifiable check passes.

- [ ] **Step 2: Clean up test data**

Delete any test admin accounts created during this pass, and confirm the seeded Super Admin's `name`/`email`/`password`/`role` are exactly back to their documented values (`GCFitness Admin` / `admin@gcfitness.club` / `password` / `super_admin`).

- [ ] **Step 3: Real dev-DB migration note (for finishing this branch)**

This plan adds columns and drops a table — unlike Plans 4 and 5, this one **does** need `php artisan migrate` run against the real dev database when the branch is finished (never `migrate:fresh`, which would wipe real data). No additional seeding is needed beyond the migration's own backfill of `admin@gcfitness.club` to `role: 'super_admin'`, since that email already exists in the real dev DB from phase 2's earlier work.
