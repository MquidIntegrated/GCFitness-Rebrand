# GCFitness Admin CMS & Backend — Design Spec

**Date:** 2026-09-03
**Status:** Approved for planning (phase 2)

## Background

Phase 1 (see `docs/superpowers/specs/2026-09-02-gcfitness-public-site-migration-design.md`) replicated the GCFitness public marketing site onto Laravel + Inertia + React + MySQL, backed by real Eloquent models seeded with the site's actual content. It deliberately excluded the admin CMS, real authentication, image upload, and the dashboard — all present in the source app (`C:\Users\Project Office 6\Desktop\GC-Fitness-Rebrand`) only as a mocked (MSW-intercepted), localStorage-token-authenticated admin panel with no real backend behind it.

Phase 2 replaces that mock with a real Laravel-backed admin CMS: real session authentication, real CRUD for all 10 content types, real image upload, drag-and-drop content ordering, and a real dashboard — while replicating the source app's actual designed admin UI (shadcn/ui component set, react-hook-form + zod forms, drag-and-drop, charts) rather than building a simplified interface.

## Decisions Made

- **Auth**: Laravel session auth (`web` guard), hand-wired rather than via Breeze/Jetstream (the source app's own login/forgot-password/reset-password page designs are ported like every other page, then wired to Laravel's built-in password-reset notification system underneath). Reuses the existing `users` table as-is — there is no public user-registration concept anywhere in this app, so "a user" is an admin/staff account. One admin user is seeded for login. All `/admin/*` routes sit behind `auth` middleware except the login/forgot-password/reset-password pages themselves.
- **Dependency management**: before any admin code is written, a single dependency-sync task copies the exact version ranges the source app declares in its own `package.json` for every admin-relevant package (`@radix-ui/*`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `recharts`, `cmdk`, `vaul`, `sonner`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `date-fns`, `class-variance-authority`) into this project's `package.json`, then a single `npm install`. This closes off the version-drift failure mode discovered in phase 1 (an unpinned `npm install lucide-react` grabbed a newer major version than the source app used, silently dropping icons the footer needed) — copying the source's own caret ranges guarantees npm's resolver can never cross into a version the source app doesn't already prove works.
- **Data-fetching architecture**: Inertia-native, not a port of the source's `axios` + React Query + mocked-API pattern. Admin pages receive data as Inertia props (same pattern as every phase 1 public page); forms use `@inertiajs/react`'s `useForm` hook and submit to ordinary Laravel controllers that validate and redirect back with flash messages. No `routes/api.php`, no JSON API controllers, no React Query, no `axios` admin API client layer. This is a deliberate deviation from the source's actual code — chosen because building a parallel JSON API surface would duplicate the pattern the rest of this app (all of phase 1) already uses successfully, for no benefit, since nothing else needs a JSON API.
- **UI fidelity**: the admin CMS replicates the source app's actual designed admin UI exactly — the full shadcn/ui + Radix component set (already framework-agnostic, ports with no logic changes), the same shared admin chrome, and the same per-resource forms/lists — with one deliberate exception (see next point).
- **Admin forms carry more fields than the source app's admin type definitions**, for `Program` and `MembershipPlan` specifically. The source app's admin CMS types (`src/lib/admin-api/types.ts`) only have one `description` field per program and one `features` list per plan, because the source's public pages never actually read from its CMS — everything was hardcoded independently. Phase 1's public-site migration instead gave `Program` both `description` (full, Programs page) and `home_description` (short, Home preview), and `MembershipPlan` both `features` and `home_features`, per the user's "exact replication" decision for that content drift. The admin forms for these two resources therefore need one extra field each beyond what the source admin UI has, or that content becomes permanently frozen at whatever phase 1 seeded. This will be reviewed after implementation.
- **New model**: `SocialLink` (dropped from phase 1's scope since the public footer only ever had unlabeled placeholder icons with no real content). Built as a full admin-manageable resource in this phase, but the public footer is *not* wired to consume it yet — that remains hardcoded as phase 1 left it. Wiring the footer to real social links is an explicit follow-up, out of scope here.
- **Image uploads**: Laravel's local public disk (`storage/app/public`, exposed via `php artisan storage:link`), replacing the source app's single shared placeholder SVG. Uploaded files populate the same `image_path`/`logo_path` columns phase 1 already built (`Program`, `Trainer`, `Partner`).
- **No changes to phase 1's public pages**, except that `Program` and `MembershipPlan` become admin-editable (they already have all the columns needed; only the admin form gains fields, no migration changes needed).

## Build Order

1. Dependency sync (all admin npm packages pinned to source's exact versions, verified via `npm install` + `npm run build`)
2. Auth (session login/logout, password reset, `auth` middleware on `/admin/*`, seeded admin user)
3. Simple CRUD resources — no image upload, no reordering: FAQs, Testimonials, `SocialLink` (new model), `SiteSetting` (single-row settings form, not a list)
4. Image-upload CRUD resources: Partners, Programs (with the extra `home_description` field), Trainers, Membership Plans (with the extra `home_features` field)
5. Locations (`ClubLocation`) — simple CRUD, no image upload
6. Drag-and-drop reordering, applied to the resources that need manual ordering (matching the source app's actual reorder-capable resources)
7. Dashboard (summary counts, recent activity, activity-trend chart)

## Target Architecture

- **Auth**: `AuthController` (login/logout), Laravel's built-in `Password` facade / reset-notification flow for forgot/reset-password, `auth` middleware group wrapping all `/admin/*` routes except the three auth pages.
- **Backend**: one Laravel resource-style controller per admin content type, each returning Inertia renders for `index`/`create`/`edit` and redirecting back (with flash messages) for `store`/`update`/`destroy`. Validation via Laravel Form Requests (mirroring the source's `zod` schemas' rules).
- **Frontend**: `resources/js/Pages/Admin/*` for pages, `resources/js/Components/ui/*` for the ported shadcn/ui set, `resources/js/Components/admin/*` for the shared admin chrome and per-resource forms/lists, mirroring the source app's `src/components/ui/` and `src/components/admin/` layout.
- **Ordering**: drag-and-drop reordering persists via a dedicated reorder endpoint per resource (e.g. `PATCH /admin/programs/reorder`) that bulk-updates `sort_order` — reusing the same `sort_order` column phase 1 already added to every orderable table.
- **Dashboard**: a single controller action aggregating counts (`Program::count()`, etc.), recent activity (derived from `updated_at` timestamps across content tables, since there's no separate audit-log table), and a 14-day activity-trend chart (grouped by `updated_at` date) — matching the source app's `DashboardSummary` shape as closely as the data allows.

## Testing / Verification Approach

Same manual, per-step verification pattern as phase 1 (no automated test suite planned for phase 2 either): each task ends with a concrete `artisan`/curl/browser-reachable check, and a human does the final interactive/visual pass (forms actually submitting, drag-and-drop actually reordering, image upload actually working) since this session still has no browser-automation tool.

## Open Item Carried From Phase 1

The footer (`SiteFooter.jsx`) still hardcodes the same address/phone/email that `SiteSetting` also stores (noted in phase 1's final review). Now that `SiteSetting` becomes admin-editable in this phase, this duplication becomes more visible — an admin editing site settings won't see the footer update. Still explicitly out of scope for this plan; flagged again here for whenever it's prioritized.
