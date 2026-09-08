# Admin Role-Based Auth & One-Time Login — Design

## Goal

Replace the current single-admin, email-based password-reset system with a two-role admin system (Super Admin / Admin) where account creation and password recovery both happen through a Super-Admin-issued one-time temporary password, with no email involved anywhere.

## Current State (for context)

- One hardcoded admin account (`App\Models\User`, no roles), seeded via `AdminUserSeeder`.
- Full Laravel password-broker flow: `/admin/forgot-password` → `Password::sendResetLink()` → emailed link (currently written to `storage/logs/laravel.log` since `MAIL_MAILER=log`) → `/admin/reset-password?token=...` → `Password::reset()`.
- `AppServiceProvider::boot()` overrides `ResetPassword::createUrlUsing()` to point the emailed link at this app's own Inertia route.
- No roles, no account management UI, no way to create a second admin account at all.

This design replaces all of the above.

## Roles

Exactly two, stored as a plain string column — no new package, no permissions table:

- **`super_admin`** — exactly one account, ever. It is the account being grandfathered in (`admin@gcfitness.club`). It is permanently protected: it can never be deactivated or removed, and there is no UI path anywhere to create a second Super Admin.
- **`admin`** — any number of accounts, created only by the Super Admin. Functionally identical to the Super Admin everywhere else in the app (Programs, Trainers, Dashboard, all existing admin CRUD) — the role only matters for the Manage Admins area described below.

## Data Model Changes

One migration adding columns to the existing `users` table (no new tables):

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('role')->default('admin')->after('email');
    $table->boolean('is_active')->default(true)->after('role');
    $table->boolean('must_change_password')->default(false)->after('is_active');
    $table->string('temp_password_hash')->nullable()->after('password');
    $table->timestamp('temp_password_expires_at')->nullable()->after('temp_password_hash');
});

DB::table('users')->where('email', 'admin@gcfitness.club')->update(['role' => 'super_admin']);
```

A second migration drops the now-unused `password_reset_tokens` table (nothing will write to it once the email-based flow is removed):

```php
Schema::dropIfExists('password_reset_tokens');
```

`AdminUserSeeder` is updated to also set `'role' => 'super_admin'` on its `updateOrCreate` call, so a fresh `migrate:fresh --seed` produces the same result as the migration's backfill.

`temp_password_hash` is deliberately a **separate** column from `password` — issuing a temp password (for creation or reset) never touches, overwrites, or reveals the account's real password. Both can be valid for login simultaneously during the temp password's 1-hour window; whichever the person uses, they land in the same place.

## Authentication Flow (login)

`AuthController::login()` changes from a single `Auth::attempt()` call to two checks, since a temp password needs custom matching logic Laravel's built-in attempt doesn't support:

1. Look up the user by email. If not found, or `is_active` is false, fail with the same generic "Invalid email or password" message used today (a deactivated account gives no hint that it exists, same as a wrong email).
2. If the submitted password matches the real `password` column (`Hash::check`) → log in normally.
3. Else, if there's a non-expired `temp_password_hash` and the submitted password matches it (`Hash::check`) → log in via that instead.
4. Either way, `$request->session()->regenerate()` and redirect to the dashboard as today.

A global check (a small piece of middleware inside the existing `auth.admin` group, next to `AuthenticateAdmin`) inspects `must_change_password` on every authenticated request. If true, every route except the new "set password" page and logout redirects there instead — so a temp-password login (whether from account creation or a reset) can't reach the dashboard, or anything else, until a real password is set.

## Temporary ("One-Time") Login Mechanism

One shared internal action — `issueTemporaryPassword(User $user)` — used by both flows below:

- Generates a random password (`Str::password(12, symbols: false)` — strong, but easy to read aloud or paste into chat without punctuation getting mangled).
- Hashes it into `temp_password_hash`, sets `temp_password_expires_at` to one hour from now, sets `must_change_password = true`.
- Returns the plaintext once, for display — it is never stored or logged in plaintext anywhere, and generating a new one for the same account immediately invalidates any prior unused one (simply overwritten).

**Creating a new Admin:** Super Admin submits name + email on the Manage Admins screen → a new `User` row is created (`role: 'admin'`, `is_active: true`, `password` set to an unguessable random hash nobody will ever type) → `issueTemporaryPassword()` runs immediately → the plaintext temp password is flashed back and shown once in a dismissible dialog with a copy button and a "this won't be shown again" warning.

**Resetting an existing Admin's access:** Super Admin clicks "Reset access" on that row → `issueTemporaryPassword()` runs against the existing account → same once-only display.

**Using it:** the Admin logs in at the normal `/admin/login` page with their email and the temp password (see Authentication Flow above), and is immediately routed to the forced "set new password" screen. Submitting it: validates, updates `password`, clears `must_change_password`, `temp_password_hash`, and `temp_password_expires_at`, redirects to the dashboard. From then on they're a normal login.

If the hour passes unused, the temp password simply stops matching in step 3 above — the Super Admin just issues a fresh one.

## Account Lifecycle Management

New "Manage Admins" area, visible only to the Super Admin:

- **List**: every account's name, email, role, and active/inactive status.
- **Create**: see above.
- **Reset access**: see above.
- **Deactivate**: sets `is_active = false`, and — since sessions are stored in the database (`SESSION_DRIVER=database`) — immediately deletes that user's row(s) from the `sessions` table, so a currently-logged-in session dies right away rather than waiting for its own expiry or their next login attempt.
- **Reactivate**: sets `is_active = true`. Their old real password still works exactly as before; nothing about credentials is touched by deactivating/reactivating.
- **Remove**: permanently deletes the account, behind the same confirm-dialog pattern already used elsewhere in this app's admin CRUD (e.g. deleting a Program).

Deactivate, reactivate, and remove all refuse to act on the one Super Admin account — that account is excluded from the list of eligible targets, and the actions themselves guard against it server-side regardless of what the UI shows.

## Self-Service Password Change

Available to both roles at any time, independent of everything above: a "Change Password" screen reachable from the account/profile area, asking for current password (verified via `Hash::check` against the real `password` column — never the temp one), new password, and confirmation.

## Removed: Email-Based Password Reset

Deleted entirely:

- Routes: `GET/POST /admin/forgot-password`, `GET/POST /admin/reset-password`.
- `AuthController` methods: `showForgotPassword`, `sendResetLink`, `showResetPassword`, `resetPassword`.
- Frontend pages: `Admin/Auth/ForgotPassword.jsx`, `Admin/Auth/ResetPassword.jsx`.
- The "Forgot password?" link on the login page.
- `AppServiceProvider::boot()`'s `ResetPassword::createUrlUsing()` override (no longer meaningful — nothing calls the password broker anymore).
- The `password_reset_tokens` table (migration drops it).

`config/auth.php`'s stock `passwords` broker config is left untouched — harmless and unused, not worth a diff.

## Frontend Pages (new/changed)

- **`Admin/ManageAdmins/Index.jsx`** (new, Super Admin only) — the account list + all lifecycle actions, following this project's established Sheet-drawer-on-index pattern (same shape as Partners/Locations) for Create, with inline row actions for reset-access/deactivate/reactivate/remove and a `DeleteConfirmDialog` reuse for Remove.
- **`Admin/Auth/SetPassword.jsx`** (new) — shown automatically (via the `must_change_password` middleware redirect) after any temp-password login. Just new password + confirm; no token, no email — the user is already authenticated at this point.
- **`Admin/Auth/ChangePassword.jsx`** (new) — self-service, current password + new password + confirm.
- **`Admin/Auth/Login.jsx`** — remove the "Forgot password?" link; no other changes (it already silently accepts a temp password once the backend supports it).
- **`Admin/Auth/ForgotPassword.jsx`, `Admin/Auth/ResetPassword.jsx`** — deleted.
- Sidebar nav (`adminNavItems.js` / `AdminShell.jsx`) — a new "Manage Admins" link, rendered only when the logged-in user's `role` is `super_admin`.

## Route Map

New/changed, all under the existing `Route::prefix('admin')->name('admin.')` group:

| Route | Method | Name | Guard |
|---|---|---|---|
| `/admin/admins` | GET | `admin.admins.index` | `auth.admin` + Super Admin only |
| `/admin/admins` | POST | `admin.admins.store` | `auth.admin` + Super Admin only |
| `/admin/admins/{user}/reset-access` | POST | `admin.admins.reset-access` | `auth.admin` + Super Admin only |
| `/admin/admins/{user}/deactivate` | POST | `admin.admins.deactivate` | `auth.admin` + Super Admin only |
| `/admin/admins/{user}/reactivate` | POST | `admin.admins.reactivate` | `auth.admin` + Super Admin only |
| `/admin/admins/{user}` | DELETE | `admin.admins.destroy` | `auth.admin` + Super Admin only |
| `/admin/set-password` | GET | `admin.password.set` | `auth.admin` only (reachable regardless of `must_change_password`, since it's the escape valve) |
| `/admin/set-password` | POST | `admin.password.set.update` | `auth.admin` only |
| `/admin/account/password` | GET | `admin.account.password.edit` | `auth.admin` only |
| `/admin/account/password` | POST | `admin.account.password.update` | `auth.admin` only |

Removed: `admin.forgot-password`, `admin.password.email`, `admin.password.reset`, `admin.password.update` (old names — freed up, not reused, to avoid any confusion with the new `admin.password.set*` names above).

The "Super Admin only" guard is a new small middleware (`EnsureSuperAdmin`, aliased `role.super_admin`), matching the existing style of `AuthenticateAdmin`/`auth.admin` already in this codebase.

## Security Considerations

- Temp passwords are hashed with the same `Hash::make`/`Hash::check` as real passwords — never stored or logged in plaintext.
- The existing `throttle:5,1` on the login route already rate-limits guessing attempts against a temp password exactly as it does real passwords — no separate throttle needed.
- Deactivation kills sessions immediately by deleting the user's rows from the database-backed `sessions` table, not just by blocking future logins.
- The Super Admin account is protected at the data/action layer (server-side), not just hidden in the UI — even a direct request to deactivate/remove it is refused.
- Login's generic error message is preserved for every failure case (wrong password, temp password, inactive account, unknown email) — none of them leak which specific thing was wrong.

## Out of Scope / Deferred

Explicitly not part of this design (can be revisited later if actually needed):

- Multiple Super Admins.
- Any granular, per-resource permission system (e.g. Spatie) — the role check is a single yes/no gate on one area.
- An audit log of who created/reset/deactivated whom.
- Email verification, 2FA, or any other auth hardening beyond what's described above.

## Global Constraints (for implementation)

- No new Composer packages — role check is a plain string column comparison.
- No new database tables — everything lives on `users`; `password_reset_tokens` is dropped, not replaced.
- Inertia-native throughout, matching every other admin flow in this project: controllers compute and redirect, no JSON API.
- Reuse existing UI patterns rather than inventing new ones: `DeleteConfirmDialog` for Remove, the same Sheet-drawer-on-index shape as Partners/Locations for the Manage Admins list, the same form/validation error style (`role="alert"`, inline field errors) used everywhere else.
