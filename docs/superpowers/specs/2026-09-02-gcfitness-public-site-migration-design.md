# GCFitness Public Site Migration — Design Spec

**Date:** 2026-09-02
**Status:** Approved for planning (phase 1 only)

## Background

`GcFitness-Laravel-Rebrand` is a near-blank Laravel 12 + Inertia.js v2 + React 19 + Tailwind v4 + Vite scaffold, currently containing only a tutorial-leftover Posts CRUD demo. The goal is to fully replicate a separate, existing React application — `GC-Fitness-Rebrand` (a gym/fitness brand site) — onto this Laravel+Inertia+React stack, using MySQL as the database.

The source app (`GC-Fitness-Rebrand`) is built with TanStack Start (file-based routing via `@tanstack/react-router`), TypeScript, Tailwind v4, and shadcn/ui + Radix components. It is really two applications:

1. **Public marketing site** — 5 pages (Home, About, Programs, Membership, Contact).
2. **Admin CMS** — 10 content-management sections (programs, trainers, membership plans, locations, testimonials, partners, social links, site settings, stats, FAQs) with CRUD forms, mock localStorage auth, and all data served by MSW (Mock Service Worker) — i.e. there is no real backend today.

Given the combined scope (~18 routes, 100+ components, ~16k LOC), this migration is split into two sub-projects:

- **Phase 1 (this spec): Public site.** Port the 5 public pages and their shared UI onto Inertia+React, backed by real Eloquent models/MySQL instead of hardcoded arrays.
- **Phase 2 (future, separate spec): Admin CMS + backend.** Real Laravel auth, controllers, and CRUD forms replacing the MSW-mocked admin API, built once phase 1 is verified working.

The user wants this done **process by process**: a small, ordered sequence of steps, each verified working before moving to the next — not one large batch of changes. See `[[feedback_process_by_process]]` memory.

## Addendum (added while writing the implementation plan, 2026-09-02)

Two corrections surfaced once the plan needed exact field values and seed content:

- **Content source correction**: this spec originally assumed seeding from `GC-Fitness-Rebrand/src/mocks/seed-data.ts`. Reading the actual page source showed that file is used exclusively by the source app's mocked *admin* API — none of the 5 public pages import from it. Each page hardcodes its own content instead, and that content genuinely drifts between pages showing the "same" thing (e.g. a program's Home-page blurb vs. its Programs-page description; a membership plan's Home-preview feature count vs. its Membership-page feature count). The implementation plan seeds from each page's real, actual content rather than the mock CMS data.
- **Exact replication decision**: given that drift, the user decided (2026-09-02) that both variants should be stored and rendered as-is, rather than collapsed into one canonical version — see the plan's Global Constraints section.
- **Data layer task granularity**: rather than one "Step 1" covering all 10 content models, the plan breaks this into one task per model (Program, Trainer, Testimonial, Faq, ClubLocation, Partner, MembershipPlan, Stat, SiteSetting), matching the user's process-by-process preference. `SocialLink` was dropped from scope — the footer's social icons are unlabeled placeholder links (`href="#"`) in the source app with no real content to seed.

See `docs/superpowers/plans/2026-09-02-gcfitness-public-site-migration.md` for the full implementation plan.

## Decisions Made

- **Content storage**: DB-backed from day one, not hardcoded-then-migrated. Schema is derived from the source app's `src/lib/admin-api/types.ts` and seeded from `src/mocks/seed-data.ts`'s current content. This avoids doing the page-wiring work twice when phase 2's admin CMS arrives.
- **Contact form**: stays exactly as in the source app — client-side `fetch` to the existing Formspree endpoint (`https://formspree.io/f/xaqrkzag`). No Laravel backend involvement, no `contact_submissions` table.
- **Posts demo**: removed entirely (not repurposed). It was tutorial scaffold, unrelated to GCFitness.
- **Phase boundary**: phase 1 touches only the public site. No auth, no admin routes, no image upload, no dashboard/charts, no drag-and-drop ordering — all of that is explicitly phase 2.

## Target Architecture (Phase 1)

- **Backend**: Laravel 12 controllers per public page, each passing Eloquent-model data to Inertia as props (`Inertia::render('Home', [...])`). No JSON API layer — Inertia's request/response cycle replaces the source app's `axios`/MSW calls entirely for the public site (there weren't any to begin with; public content was hardcoded).
- **Database**: MySQL. One migration + model per content type needed by the public pages.
- **Frontend**: React 19 function components under `resources/js/Pages/*`, styled with the ported Tailwind v4 theme and shadcn/ui + Radix component set. `@inertiajs/react`'s `<Link>`/`usePage()` replace `@tanstack/react-router`'s routing/loader primitives.
- **Assets**: images copied from the source app's `src/assets/` into this project (e.g. `resources/images/` or `public/images/`, referenced via Vite asset handling).

## Step-by-Step Plan

### Step 0 — Cleanup
Remove the tutorial scaffold: `app/Http/Controllers/PostController.php`, `app/Models/Post.php`, its migration, the `posts` resource route in `routes/web.php`, and `resources/js/Pages/{Home,Create,Edit,Show}.jsx`. Verify the app still boots with an empty `/`.

### Step 1 — Data layer
Create migrations, Eloquent models, and seeders for:

| Model | Purpose | Source reference |
|---|---|---|
| `Program` | Class/training program types (e.g. HIIT, Boxing, Yoga) | `src/mocks/seed-data.ts`, `types.ts` |
| `Trainer` | Trainer profiles | same |
| `MembershipPlan` | Pricing tiers | same |
| `Testimonial` | Member testimonials | same |
| `Partner` | Sponsor/partner logos | same |
| `Faq` | FAQ entries (used on Contact page) | same |
| `Location` | Club/gym locations (used on Contact page) | same |
| `SiteSetting` | Global site settings (single-row config: contact info, socials fallback, etc.) | same |
| `SocialLink` | Social media links | same |
| `Stat` | Homepage stat counters (e.g. "500+ members") | same |

Seeders populate each table with the current hardcoded content pulled from the source route files and `seed-data.ts`, so pages render real data immediately. Verify via `php artisan migrate:fresh --seed` and `php artisan tinker` spot checks.

### Step 2 — Shared foundation
- Port Tailwind v4 config: theme tokens, `oklch()` brand colors, light/dark CSS variable blocks, custom fonts (Bebas Neue / Oswald for `--font-hero`) from the source `src/styles.css` into this project's global stylesheet.
- Port the shadcn/ui + Radix component set from `src/components/ui/*` into `resources/js/Components/ui/*` (or equivalent), adjusting only import paths — these are framework-agnostic React components and should need no logic changes.
- Port shared layout/interaction components: `SiteNav`, `SiteFooter`, `PageHero`, `Reveal` (scroll-reveal), `Preloader`, `ScrollToTop`, `ThemeProvider`, `CutoutImage`, `FaqItem`.
- Verify: build a throwaway placeholder page using the ported layout + a couple of `ui` components to confirm styling, fonts, theme toggle, nav, and footer all render correctly before touching real pages.

### Step 3 — Pages (one at a time, each verified in-browser before starting the next)
1. **Home** — largest page; hero, program highlights, stats, testimonials, partners, CTA sections.
2. **About** — mission content, trainer highlights.
3. **Programs** — full program listing from `Program` model.
4. **Membership** — plans listing from `MembershipPlan` model.
5. **Contact** — club locations (`Location` model), FAQs (`Faq` model), and the Formspree-backed contact form (unchanged client-side behavior).

For each page: add the Laravel route, add the controller action passing the relevant Eloquent data as Inertia props, port the React page component and its page-specific subcomponents, then load it in the browser and visually compare against the source app before moving to the next page.

## Explicitly Out of Scope (Phase 2)

- Admin CMS routes, controllers, and React pages (all 10 content-management sections).
- Real authentication (replacing the source app's mock localStorage token auth) — likely Laravel session-based auth guarding `/admin/*`.
- Image upload handling.
- Admin dashboard charts/stats.
- Drag-and-drop content ordering.
- Any REST/JSON API — phase 2 should be scoped separately to decide whether admin CRUD goes through Inertia forms directly (likely, matching this app's existing pattern) or a separate API.

## Testing / Verification Approach

No automated test suite is being ported in phase 1 (the source app's Vitest tests are admin-CMS-focused and out of scope). Verification is manual, per-step:
- Step 0: app boots, no references to removed Post code remain.
- Step 1: `migrate:fresh --seed` succeeds; seeded data spot-checked via tinker.
- Step 2: placeholder page visually confirms shared foundation.
- Step 3: each page individually loaded and visually compared to the source app before proceeding to the next.
