# GCFitness Public Site Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate the 5-page GCFitness public marketing site (currently a TanStack Start + React app at `C:\Users\Project Office 6\Desktop\GC-Fitness-Rebrand`) onto this project's Laravel 12 + Inertia.js v2 + React 19 + MySQL stack, with content served from real Eloquent models instead of hardcoded arrays.

**Architecture:** Each public page becomes a Laravel route → controller (passing Eloquent data as Inertia props) → React page component under `resources/js/Pages`. Shared chrome (nav, footer, hero, theme, scroll/preload effects) is ported once as reusable components and wired into a persistent Inertia layout. Content that repeats across pages (programs, trainers, testimonials, FAQs, membership plans, locations, partners, site stats) lives in its own migration/model/seeder, seeded with the site's real current copy.

**Tech Stack:** Laravel 12, Inertia.js v2 (`@inertiajs/react`), React 19, Tailwind CSS v4, Vite 7, MySQL, `lucide-react`, `clsx`, `tailwind-merge`.

**Spec:** `docs/superpowers/specs/2026-09-02-gcfitness-public-site-migration-design.md`

## Global Constraints

- Source of truth for all content/markup/styling is the real files in `C:\Users\Project Office 6\Desktop\GC-Fitness-Rebrand` — every task below quotes the exact source it was ported from.
- **Exact replication, not deduplication**: where the source app shows the same "kind" of content differently on two pages (e.g. Home's shorter program blurbs vs. the Programs page's fuller ones; Home's 4-item membership feature lists vs. the Membership page's 5-item lists), both variants are stored and rendered — do not collapse them into one "canonical" version. This was an explicit user decision (2026-09-02) after the drift was discovered during planning.
- Routing translation table (TanStack Router → Inertia), used throughout: `<Link to="/x">` → `<Link href="/x">` (`@inertiajs/react`); `createFileRoute(...)` route/meta config → plain Laravel `Route::get()` + a `<Head>` block in the page component; `activeOptions`/`data-[status=active]:` active-link styling → compare `usePage().url` against the link's href in JS and switch the className manually (Inertia does not stamp a `data-status` attribute); `useRouterState` (route-pending flag) → `router.on('start', ...)` / `router.on('finish', ...)` from `@inertiajs/react`; TanStack's `head: () => ({ meta: [...] })` → an Inertia `<Head>` component per page.
- Two image storage strategies, chosen per task: **DB-driven content images** (programs, trainers, partners — anything a future admin CMS will edit) live in `public/images/<type>/...` and are referenced as plain path strings from the database (no JS import possible for dynamic paths). **Static page-decoration images** (hero photos, mission photos, etc. — not admin-editable in phase 1) live in `resources/js/assets/` and are imported directly in the page component exactly as the source app does (`import heroHome from "@/assets/hero-home.jpg"`), letting Vite bundle them.
- No `react-hook-form`, `zod`, Radix, or shadcn/ui components are needed for this phase — none of the 5 public pages or their shared components import from `@/components/ui` in the source app (that entire set is admin-CMS-only). Only `lucide-react` (icons) and `clsx` + `tailwind-merge` (via a `cn()` helper) are needed as new frontend dependencies.
- Every task ends with a concrete, in-browser or `tinker`/`artisan` verification step — no task is "done" on code existing alone.

---

## Task 1: Remove the Post demo scaffold

The current app only contains a tutorial-leftover Posts CRUD (`PostController`, `Post` model/migration, demo pages). It's unrelated to GCFitness and must be gone before the real work starts.

**Files:**
- Delete: `app/Http/Controllers/PostController.php`
- Delete: `app/Models/Post.php`
- Delete: `database/migrations/2026_03_03_161502_create_posts_table.php`
- Delete: `resources/js/Pages/Home.jsx`, `resources/js/Pages/Create.jsx`, `resources/js/Pages/Edit.jsx`, `resources/js/Pages/Show.jsx`
- Modify: `routes/web.php`

**Interfaces:**
- Produces: an empty `routes/web.php` (just the `use` statements and no routes) that Task 16 (Home page) will add to.

- [ ] **Step 1: Delete the scaffold files**

Delete these files:
- `app/Http/Controllers/PostController.php`
- `app/Models/Post.php`
- `database/migrations/2026_03_03_161502_create_posts_table.php`
- `resources/js/Pages/Home.jsx`
- `resources/js/Pages/Create.jsx`
- `resources/js/Pages/Edit.jsx`
- `resources/js/Pages/Show.jsx`

- [ ] **Step 2: Empty out `routes/web.php`**

Replace the entire contents of `routes/web.php` with:

```php
<?php

use Illuminate\Support\Facades\Route;
```

- [ ] **Step 3: Drop the `posts` table if the app has already been migrated**

Run: `php artisan migrate:status`

If `create_posts_table` shows as `Ran`, run: `php artisan migrate:rollback --step=1` (this only rolls back the most recent migration, which is the posts table since it has the newest timestamp). Confirm with `php artisan migrate:status` that no `posts` migration is listed as pending rollback and the `posts` table is gone (check with `php artisan tinker` → `Schema::hasTable('posts')` → expect `false`).

- [ ] **Step 4: Verify the app still boots**

Run: `php artisan serve` (or your existing dev workflow) and `npm run dev` in another terminal, then visit `/` in a browser.

Expected: a blank/error page is fine at this point (no route handles `/` yet) — the goal is just confirming no leftover reference to `Post`/`PostController` breaks the boot (check the terminal/log for fatal errors, not a rendered page).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove Post tutorial scaffold ahead of GCFitness migration"
```

---

## Task 2: Global styles, fonts, and theme boot script

Ports the source app's design tokens, custom utilities/animations, and font loading from `src/styles.css` and `src/routes/__root.tsx` (both in `GC-Fitness-Rebrand`) into this project's `resources/css/app.css` and `resources/views/app.blade.php`.

**Files:**
- Modify: `resources/css/app.css`
- Modify: `resources/views/app.blade.php`

**Interfaces:**
- Produces: CSS custom properties (`--color-brand`, `--color-background`, etc.), utility classes (`.font-hero`, `.font-display`, `.hero-overlay`, `.bg-grid`, `.text-outline`, `.text-gradient-brand`, `.reveal`/`.is-visible`, `.animate-marquee`, `.animate-glow-pulse`, `.animate-float-slow`, `.animate-fade-up`, `.animate-fade-in`, `.animate-scale-in`, `.animate-preloader-bar`, `.animate-route-roller`, `.animate-ken-burns`, `.marquee-fade`, `.glass-fade`, `.delay-100`..`.delay-500`) and the `dark`/`light` root classes that every later task's components rely on.
- Consumes: nothing (first visual-layer task).

- [ ] **Step 1: Replace `resources/css/app.css`'s content**

The current file only has the default Laravel/Poppins styling from the tutorial scaffold. Replace its entire contents with the source app's `src/styles.css`, verbatim, with two adjustments: drop line 1's `source(none)` and line 2's `@source "../src"` (Tailwind v4 content-scanning directives that don't apply to this project's file layout — Tailwind's Vite plugin already scans `resources/**` by default in this project), and keep everything else identical (theme tokens, dark/light blocks, utilities, keyframes, `prefers-reduced-motion` block).

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-hero: "Bebas Neue", "Oswald", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Oswald", ui-sans-serif, system-ui, sans-serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-glow: var(--brand-glow);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);

  --radius-sm: calc(var(--radius) - 6px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 8px);
  --radius-2xl: calc(var(--radius) + 16px);

  --shadow-brand: 0 20px 60px -20px color-mix(in oklab, var(--brand) 55%, transparent);
  --shadow-elevated: 0 30px 80px -30px oklch(0 0 0 / 0.8);
}

/* Dark theme (default) */
:root,
.dark {
  --radius: 1rem;

  --brand: oklch(0.53 0.16 348);
  --brand-hover: oklch(0.6 0.17 348);
  --brand-glow: oklch(0.53 0.16 348 / 0.35);

  --background: oklch(0.09 0 0);
  --foreground: oklch(1 0 0);
  --surface: oklch(0.115 0 0);
  --card: oklch(0.14 0 0);
  --card-foreground: oklch(1 0 0);
  --popover: oklch(0.14 0 0);
  --popover-foreground: oklch(1 0 0);

  --primary: var(--brand);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.18 0 0);
  --secondary-foreground: oklch(0.98 0 0);
  --muted: oklch(0.18 0 0);
  --muted-foreground: oklch(0.7 0 0);
  --accent: var(--brand);
  --accent-foreground: oklch(1 0 0);
  --destructive: oklch(0.65 0.22 20);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(1 0 0 / 0.08);
  --input: oklch(1 0 0 / 0.12);
  --ring: var(--brand);

  --success: oklch(0.78 0.18 155);
  --warning: oklch(0.82 0.16 80);
  --danger: oklch(0.7 0.2 15);

  --hero-overlay-1: var(--background);
  --hero-overlay-2: color-mix(in oklab, var(--background) 85%, transparent);
  --hero-overlay-3: color-mix(in oklab, var(--background) 10%, transparent);

  --hero-mobile-bg: oklch(0.09 0 0);
}

/* Light theme — eye-friendly warm off-white (not stark white) */
.light {
  --radius: 1rem;

  --brand: oklch(0.5 0.18 348);
  --brand-hover: oklch(0.45 0.19 348);
  --brand-glow: oklch(0.5 0.18 348 / 0.25);

  --background: oklch(0.96 0.008 80);
  --foreground: oklch(0.2 0.01 60);
  --surface: oklch(0.93 0.01 80);
  --card: oklch(0.98 0.01 75);
  --card-foreground: oklch(0.2 0.01 60);
  --popover: oklch(0.98 0.01 75);
  --popover-foreground: oklch(0.2 0.01 60);

  --primary: var(--brand);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.9 0.01 80);
  --secondary-foreground: oklch(0.2 0.01 60);
  --muted: oklch(0.9 0.01 80);
  --muted-foreground: oklch(0.32 0.015 60);
  --accent: var(--brand);
  --accent-foreground: oklch(1 0 0);
  --destructive: oklch(0.6 0.22 20);
  --destructive-foreground: oklch(1 0 0);
  --border: oklch(0 0 0 / 0.1);
  --input: oklch(0 0 0 / 0.14);
  --ring: var(--brand);

  --success: oklch(0.6 0.18 155);
  --warning: oklch(0.72 0.16 80);
  --danger: oklch(0.6 0.2 15);

  --hero-overlay-1: color-mix(in oklab, oklch(0.88 0.02 75) 30%, transparent);
  --hero-overlay-2: color-mix(in oklab, oklch(0.88 0.02 75) 15%, transparent);
  --hero-overlay-3: transparent;
}

.dark { color-scheme: dark; }
.light { color-scheme: light; }

@layer base {
  * { border-color: var(--color-border); }

  html {
    scroll-behavior: smooth;
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    transition: background-color 0.4s ease, color 0.4s ease;
  }

  ::selection {
    background: var(--color-brand);
    color: white;
  }
}

@utility font-hero {
  font-family: var(--font-hero);
  letter-spacing: 0.005em;
  font-weight: 400;
}

@utility font-display {
  font-family: var(--font-display);
  letter-spacing: -0.01em;
  font-weight: 600;
}

@utility hero-overlay {
  background-image: linear-gradient(to right, var(--hero-overlay-1), var(--hero-overlay-2), var(--hero-overlay-3));
}

@utility bg-grid {
  background-image:
    linear-gradient(to right, color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklab, var(--foreground) 6%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
}

@utility bg-brand-radial {
  background: radial-gradient(
    ellipse at center,
    color-mix(in oklab, var(--brand) 40%, transparent) 0%,
    transparent 70%
  );
}

@utility text-outline {
  color: transparent;
  -webkit-text-stroke: 1.5px var(--color-foreground);
  text-stroke: 1.5px var(--color-foreground);
}

@utility text-gradient-brand {
  background: linear-gradient(135deg, var(--color-foreground) 0%, var(--brand) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Scroll reveal */
@utility reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes glow-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
@keyframes float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}
@keyframes fade-up {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes preloader-bar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes ken-burns {
  0% { transform: scale(1); }
  100% { transform: scale(1.08); }
}
@keyframes route-roller {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(150%); }
  100% { transform: translateX(400%); }
}

.animate-marquee { animation: marquee 70s linear infinite; }

@utility marquee-fade {
  mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 12%, black 88%, transparent);
}

@utility glass-fade {
  mask-image: radial-gradient(ellipse at center, black 35%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 35%, transparent 85%);
}
.animate-glow-pulse { animation: glow-pulse 4s ease-in-out infinite; }
.animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
.animate-fade-up { animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-fade-in { animation: fade-in 0.8s ease-out both; }
.animate-scale-in { animation: scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-preloader-bar { animation: preloader-bar 1.2s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
.animate-route-roller { animation: route-roller 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
.animate-ken-burns { animation: ken-burns 14s ease-out both; }

.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
.delay-500 { animation-delay: 0.5s; }

/* Prevent flash of unstyled content */
html.preload-lock body {
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .reveal { opacity: 1; transform: none; }
}
```

Note: this project's `package.json` does not yet have `tw-animate-css` — Task 4 installs it alongside the other new frontend dependencies. If you build before Task 4, the `@import "tw-animate-css"` line will fail; that's expected and resolved by Task 4.

- [ ] **Step 2: Add Google Fonts and the pre-hydration theme script to `resources/views/app.blade.php`**

Replace the file's contents with:

```blade
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap">

    <script>
        (function () {
            try {
                var t = localStorage.getItem('gcfitness-theme');
                var d = t || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                document.documentElement.classList.add(d);
            } catch (e) {
                document.documentElement.classList.add('dark');
            }
        })();
    </script>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    @inertiaHead
</head>

<body>
    @inertia
</body>

</html>
```

Two deliberate changes from the source app: the localStorage key becomes `gcfitness-theme` (the source used `axon-theme`, a leftover from an earlier product name — Task 5's `ThemeProvider` port uses this same new key, see that task); and `resources/css/app.css` is added explicitly to the `@vite(...)` call since this project's `app.jsx` doesn't import it via a JS `import` statement the way the source app's `styles.css?url` link tag did — Laravel's Vite plugin needs it listed as an entrypoint. Drop the `@routes` line if `resources/views/app.blade.php` doesn't otherwise use the Ziggy `route()` JS helper (it isn't used anywhere in this plan).

- [ ] **Step 3: Verify the CSS compiles**

Run: `npm run build`

Expected: build fails at this point only if `tw-animate-css` is missing (see the note in Step 1) — that's expected until Task 4. If it fails for any other reason (a typo introduced while copying), fix it now.

- [ ] **Step 4: Commit**

```bash
git add resources/css/app.css resources/views/app.blade.php
git commit -m "feat: port GCFitness design tokens, utilities, and font loading"
```

---

## Task 3: Copy image assets

Copies every image the 5 public pages and shared components reference, split by whether the content is DB-driven (phase 2 will let an admin change it) or static page decoration.

**Files:**
- Create: `resources/js/assets/hero-home.jpg`, `hero-about.jpg`, `hero-programs.jpg`, `hero-membership.jpg`, `hero-contact.jpg`, `about-mission.jpg`, `gym-girl3.jpg`, `gym-girl1-removebg-preview.png`, `gym-man1-removebg-preview.png`, `membership-recovery.jpg`
- Create: `public/images/programs/bodybuilding.jpg`, `boxing.jpg`, `functional.jpg`, `hiit.jpg`, `strength.jpg`, `yoga.jpg`
- Create: `public/images/trainers/trainer-1.jpg`, `trainer-2.jpg`, `trainer-3.jpg`, `trainer-4.jpg`
- Create: `public/images/partners/partner1.png`, `partner2.png`, `partner3.png`, `partner4.png`, `partner6.png`, `partner7.png`, `partner8.png`, `partner9.png`, `partner10.png`, `partner12.png`, `partner14.png`, `partner15.png`, `partner16.png`
- Modify: `public/favicon.ico` (replace with the source app's branded favicon)

**Interfaces:**
- Produces: the exact `public/images/...` paths that Task 7's Program seeder, Task 8's Trainer seeder, and Task 12's Partner seeder store as `image_path` values, and the `resources/js/assets/...` files that Tasks 16–20's page components `import`.

- [ ] **Step 1: Copy static page-decoration images**

Copy these files from `C:\Users\Project Office 6\Desktop\GC-Fitness-Rebrand\src\assets\` to `resources/js/assets/` (same filenames, no renaming):

`hero-home.jpg`, `hero-about.jpg`, `hero-programs.jpg`, `hero-membership.jpg`, `hero-contact.jpg`, `about-mission.jpg`, `gym-girl3.jpg`, `gym-girl1-removebg-preview.png`, `gym-man1-removebg-preview.png`, `membership-recovery.jpg`

- [ ] **Step 2: Copy and rename DB-driven content images**

Copy these files from `C:\Users\Project Office 6\Desktop\GC-Fitness-Rebrand\src\assets\` into `public/images/`, renaming as shown (the shorter names are what Tasks 7/8/12's seeders will reference):

| Source file | Destination |
|---|---|
| `program-bodybuilding.jpg` | `public/images/programs/bodybuilding.jpg` |
| `program-boxing.jpg` | `public/images/programs/boxing.jpg` |
| `program-functional.jpg` | `public/images/programs/functional.jpg` |
| `program-hiit.jpg` | `public/images/programs/hiit.jpg` |
| `program-strength.jpg` | `public/images/programs/strength.jpg` |
| `program-yoga.jpg` | `public/images/programs/yoga.jpg` |
| `trainer-1.jpg` | `public/images/trainers/trainer-1.jpg` |
| `trainer-2.jpg` | `public/images/trainers/trainer-2.jpg` |
| `trainer-3.jpg` | `public/images/trainers/trainer-3.jpg` |
| `trainer-4.jpg` | `public/images/trainers/trainer-4.jpg` |
| `partner1.png` … `partner16.png` (13 files, exact set: 1,2,3,4,6,7,8,9,10,12,14,15,16 — note 5,11,13 don't exist in the source) | `public/images/partners/partner1.png` … (same numbers) |

- [ ] **Step 3: Replace the favicon**

Copy `C:\Users\Project Office 6\Desktop\GC-Fitness-Rebrand\public\favicon.ico`, overwriting `public/favicon.ico` in this project.

- [ ] **Step 4: Verify**

Run `ls resources/js/assets` and `ls public/images/programs public/images/trainers public/images/partners` (or the Windows equivalents) and confirm every file from Steps 1–2 is present with the expected name.

- [ ] **Step 5: Commit**

```bash
git add resources/js/assets public/images public/favicon.ico
git commit -m "chore: copy GCFitness image assets"
```

---

## Task 4: Frontend dependencies, `cn()` helper, and ThemeProvider

Adds the only new npm packages this phase needs, the small `cn()` classname helper every shared component uses, and the theme (dark/light) context.

**Files:**
- Modify: `package.json`
- Create: `resources/js/lib/utils.js`
- Create: `resources/js/Components/ThemeProvider.jsx`

**Interfaces:**
- Produces: `cn(...inputs)` from `@/lib/utils`; `ThemeProvider` (wraps children) and `useTheme()` (returns `{ theme, toggle, setTheme }`) from `@/Components/ThemeProvider`.
- Consumes: nothing.

- [ ] **Step 1: Install dependencies**

Run: `npm install lucide-react clsx tailwind-merge tw-animate-css`

- [ ] **Step 2: Create the `cn()` helper**

Port of `GC-Fitness-Rebrand/src/lib/utils.ts`. Create `resources/js/lib/utils.js`:

```js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Port the ThemeProvider**

Port of `GC-Fitness-Rebrand/src/components/theme-provider.tsx`, with the localStorage key renamed from `axon-theme` to `gcfitness-theme` (matching Task 2 Step 2's boot script) and TypeScript types stripped. Create `resources/js/Components/ThemeProvider.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
    theme: "dark",
    toggle: () => {},
    setTheme: () => {},
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("gcfitness-theme");
            const initial =
                stored ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
            setTheme(initial);
        } catch {
            /* noop */
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        root.classList.remove("dark", "light");
        root.classList.add(theme);
        try {
            localStorage.setItem("gcfitness-theme", theme);
        } catch {
            /* noop */
        }
    }, [theme, mounted]);

    const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    return (
        <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
```

- [ ] **Step 4: Verify**

Run: `npm run build`

Expected: succeeds (the `tw-animate-css` import in `app.css` now resolves).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json resources/js/lib/utils.js resources/js/Components/ThemeProvider.jsx
git commit -m "feat: add cn() helper and ThemeProvider for GCFitness UI"
```

---

## Task 5: Shared layout components

Ports the 9 reusable components every public page sits inside: nav, footer, page hero banner, FAQ accordion item, cutout image effect, scroll-reveal wrapper, preloader, scroll-to-top button, and route-transition progress bar.

**Files:**
- Create: `resources/js/Components/SiteNav.jsx`
- Create: `resources/js/Components/SiteFooter.jsx`
- Create: `resources/js/Components/PageHero.jsx`
- Create: `resources/js/Components/FaqItem.jsx`
- Create: `resources/js/Components/CutoutImage.jsx`
- Create: `resources/js/Components/Reveal.jsx`
- Create: `resources/js/Components/Preloader.jsx`
- Create: `resources/js/Components/ScrollToTop.jsx`
- Create: `resources/js/Components/RouteLoader.jsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (Task 4), `useTheme` from `@/Components/ThemeProvider` (Task 4).
- Produces: `SiteNav({ scrolled })`, `SiteFooter()`, `PageHero({ image, eyebrow, titleOutline, titleSolid, subtitle?, children? })`, `FaqItem({ q, a })`, `CutoutImage({ src, alt, className?, size? })`, `Reveal({ children, delay?, as?, className? })`, `Preloader()`, `ScrollToTop()`, `RouteLoader()` — all consumed by Task 6's `SiteLayout` and by Tasks 16–20's pages.

- [ ] **Step 1: Port `Reveal`, `Preloader`, `ScrollToTop`, `CutoutImage`, `FaqItem` (no routing/data dependencies — direct ports)**

These 5 components don't touch routing or the theme, so they port with only the TS-type-stripping and `.tsx`→`.jsx` change. Source: `GC-Fitness-Rebrand/src/components/{reveal,preloader,scroll-to-top,cutout-image,faq-item}.tsx`.

`resources/js/Components/Reveal.jsx`:
```jsx
import { useEffect, useRef, useState } from "react";

export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        setVisible(true);
                        obs.disconnect();
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
        );
        obs.observe(node);
        return () => obs.disconnect();
    }, []);

    const style = { transitionDelay: `${delay}ms` };
    const Component = Tag;

    return (
        <Component ref={ref} style={style} className={`reveal ${visible ? "is-visible" : ""} ${className}`}>
            {children}
        </Component>
    );
}
```

`resources/js/Components/Preloader.jsx`:
```jsx
import { useEffect, useState } from "react";

export function Preloader() {
    const [hidden, setHidden] = useState(false);
    const [gone, setGone] = useState(false);

    useEffect(() => {
        document.documentElement.classList.add("preload-lock");
        const t1 = window.setTimeout(() => {
            setHidden(true);
            document.documentElement.classList.remove("preload-lock");
        }, 900);
        const t2 = window.setTimeout(() => setGone(true), 1500);
        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            document.documentElement.classList.remove("preload-lock");
        };
    }, []);

    if (gone) return null;

    return (
        <div
            aria-hidden
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
                hidden ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
        >
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/30 blur-3xl" />
            <div className="relative flex flex-col items-center">
                <div className="font-hero text-5xl tracking-widest text-foreground md:text-6xl">
                    GC<span className="text-brand">Fitness</span>
                </div>
                <div className="mt-6 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 rounded-full bg-brand animate-preloader-bar" />
                </div>
                <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                    Performance loading
                </div>
            </div>
        </div>
    );
}
```

`resources/js/Components/ScrollToTop.jsx`:
```jsx
import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll back to top"
            className={`fixed bottom-8 right-6 z-40 grid size-12 place-items-center rounded-full border border-brand/30 bg-brand/10 text-foreground shadow-elevated backdrop-blur-md transition-all duration-300 hover:border-brand/60 hover:bg-brand hover:text-white md:bottom-10 md:right-10 ${
                visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
            }`}
        >
            <ArrowUp className="size-5" />
        </button>
    );
}
```

`resources/js/Components/CutoutImage.jsx`:
```jsx
export function CutoutImage({ src, alt, className = "", size = "max-w-2xl md:max-w-4xl" }) {
    return (
        <div className={`relative overflow-visible ${className}`}>
            <div className="pointer-events-none absolute inset-x-8 bottom-2 h-1/3 rounded-full bg-foreground/10 blur-3xl" />
            <div className="relative z-10 animate-float-slow">
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    className={`mx-auto w-full ${size} scale-100 object-contain grayscale drop-shadow-[0_55px_55px_rgba(0,0,0,0.4)] md:scale-110`}
                />
            </div>
        </div>
    );
}
```

`resources/js/Components/FaqItem.jsx`:
```jsx
import { useId, useState } from "react";

export function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    const panelId = useId();

    return (
        <div className={`rounded-2xl border border-border p-6 transition-colors duration-300 ${open ? "bg-card/80" : "bg-card"}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
            >
                <span className="font-display text-lg uppercase">{q}</span>
                <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full border border-border text-brand transition-transform duration-300 ${
                        open ? "rotate-45" : ""
                    }`}
                >
                    +
                </span>
            </button>
            <div
                id={panelId}
                className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <p className="overflow-hidden pt-4 text-sm text-muted-foreground">{a}</p>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Port `RouteLoader` (routing primitive swapped for Inertia's router events)**

Source: `GC-Fitness-Rebrand/src/components/route-loader.tsx`. The source uses TanStack's `useRouterState` to read a pending-navigation flag; Inertia has no equivalent hook, so this subscribes to `router.on('start'|'finish')` instead. Create `resources/js/Components/RouteLoader.jsx`:

```jsx
import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

export function RouteLoader() {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const stopStart = router.on("start", () => setIsLoading(true));
        const stopFinish = router.on("finish", () => setIsLoading(false));
        return () => {
            stopStart();
            stopFinish();
        };
    }, []);

    return (
        <div
            aria-hidden
            className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden transition-opacity duration-300 ${
                isLoading ? "opacity-100" : "opacity-0"
            }`}
        >
            <div className="absolute inset-0 bg-border/40" />
            {isLoading && (
                <div className="absolute inset-y-0 left-0 w-1/3 animate-route-roller rounded-full bg-brand shadow-brand" />
            )}
        </div>
    );
}
```

- [ ] **Step 3: Port `PageHero` (routing primitive swapped for Inertia's `Link`)**

Source: `GC-Fitness-Rebrand/src/components/page-hero.tsx`. Only change: `@tanstack/react-router`'s `<Link to="/">` becomes `@inertiajs/react`'s `<Link href="/">`. Create `resources/js/Components/PageHero.jsx`:

```jsx
import { Link } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";

const HERO_HEIGHT = "min-h-[600px] md:min-h-[640px] lg:min-h-[600px]";
const PANEL_HEIGHT = "min-h-[380px] md:min-h-[460px]";

export function PageHero({ image, eyebrow, titleOutline, titleSolid, subtitle, children }) {
    return (
        <section className={`relative isolate overflow-hidden ${HERO_HEIGHT}`}>
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[var(--hero-mobile-bg)] md:hidden" />

                <img
                    src={image}
                    alt=""
                    aria-hidden
                    className="hidden size-full object-cover animate-ken-burns md:block"
                />
                <div className="absolute inset-0 hidden hero-overlay md:block" />
                <div className="absolute inset-x-0 bottom-0 hidden h-24 bg-gradient-to-b from-transparent to-background md:block" />

                <div
                    aria-hidden
                    className="pointer-events-none absolute -left-24 top-1/3 h-3 w-[520px] rotate-[-24deg] bg-brand/70 blur-[1px]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute left-8 bottom-6 h-1.5 w-[240px] rotate-[-24deg] bg-brand/50"
                />
            </div>

            <div className={`relative mx-auto flex ${HERO_HEIGHT} max-w-7xl flex-col justify-start px-6 pt-28 pb-14 md:pt-32 md:pb-16`}>
                <div className={`relative w-full md:w-1/2 ${PANEL_HEIGHT}`}>
                    <div className="glass-fade absolute -inset-6 hidden bg-black/50 backdrop-blur-2xl backdrop-saturate-150 md:-inset-10 dark:hidden md:block" />

                    <div className="relative p-8 md:p-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-brand bg-brand px-4 py-1.5 animate-fade-in backdrop-blur-sm dark:border-brand/40 dark:bg-brand/10">
                            <span className="size-1.5 rounded-full bg-white animate-pulse dark:bg-brand" />
                            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white dark:text-brand">
                                {eyebrow}
                            </span>
                        </div>

                        <h1 className="mt-6 font-hero uppercase leading-[0.9] tracking-tight animate-fade-up text-5xl md:text-7xl lg:text-8xl">
                            <span className="text-outline" style={{ WebkitTextStroke: "1.5px #fff" }}>
                                {titleOutline}
                            </span>{" "}
                            <span className="text-white">{titleSolid}</span>
                        </h1>

                        {subtitle && (
                            <p className="mt-5 max-w-xl text-base text-white/90 animate-fade-up delay-200 md:text-lg">
                                {subtitle}
                            </p>
                        )}

                        <nav
                            aria-label="Breadcrumb"
                            className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] animate-fade-up delay-200"
                        >
                            <Link href="/" className="text-brand hover:text-brand-hover">
                                Home
                            </Link>
                            <ChevronRight className="size-3 text-white/50" />
                            <span className="text-white/85">{eyebrow}</span>
                        </nav>

                        {children && <div className="mt-8 animate-fade-up delay-300">{children}</div>}
                    </div>
                </div>
            </div>
        </section>
    );
}
```

- [ ] **Step 4: Port `SiteNav` (routing + active-link styling swapped for Inertia)**

Source: `GC-Fitness-Rebrand/src/components/site-nav.tsx`. Two changes beyond `Link to`→`Link href`: the source relies on TanStack Router stamping `data-status="active"` on the current link (matched via Tailwind's `data-[status=active]:` variant) — Inertia has no equivalent, so active state is computed in JS from `usePage().url` and applied as a conditional class instead; and `GYM_MASTER_URL` (external member-portal link) is inlined as a constant rather than a separate `lib/external-links` module, since nothing else in this phase needs it. Create `resources/js/Components/SiteNav.jsx`:

```jsx
import { Link, usePage } from "@inertiajs/react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";

const GYM_MASTER_URL = "https://gcfitnesscentre.gymmasteronline.com/portal/login";

const links = [
    { href: "/", label: "Home" },
    { href: "/programs", label: "Programs" },
    { href: "/membership", label: "Membership" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
];

const NAV_LINK_BASE =
    "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-200";
const NAV_LINK_INACTIVE = "text-muted-foreground hover:text-foreground";
const NAV_LINK_ACTIVE = "font-bold text-foreground bg-brand/12 ring-1 ring-inset ring-brand/25";

const MOBILE_NAV_LINK_BASE =
    "rounded-xl px-3 py-2.5 text-sm font-semibold uppercase tracking-widest transition-colors duration-200";
const MOBILE_NAV_LINK_INACTIVE = "text-muted-foreground hover:bg-foreground/5 hover:text-foreground";
const MOBILE_NAV_LINK_ACTIVE = "font-bold text-foreground bg-brand/12 ring-1 ring-inset ring-brand/25";

const ICON_BUTTON =
    "grid size-10 place-items-center rounded-full border border-border bg-background/80 text-foreground shadow-sm backdrop-blur-md transition-all duration-200 hover:border-brand/60 hover:bg-brand/10 hover:text-brand";

function isActive(currentPath, href) {
    return href === "/" ? currentPath === "/" : currentPath.startsWith(href);
}

export function SiteNav({ scrolled }) {
    const [open, setOpen] = useState(false);
    const { theme, toggle } = useTheme();
    const { url } = usePage();
    const currentPath = url.split("?")[0];

    return (
        <header
            className={cn(
                "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl backdrop-saturate-150 transition-all duration-300",
                scrolled ? "border-border bg-background/80 shadow-sm" : "border-border/40 bg-background/50",
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <Link href="/" className="font-hero text-2xl tracking-widest">
                    GC<span className="text-brand">Fitness</span>
                </Link>

                <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-foreground/[0.03] p-1 backdrop-blur-sm md:flex">
                    {links.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={cn(NAV_LINK_BASE, isActive(currentPath, l.href) ? NAV_LINK_ACTIVE : NAV_LINK_INACTIVE)}
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <button onClick={toggle} aria-label="Toggle theme" className={ICON_BUTTON}>
                        {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </button>
                    <a
                        href={GYM_MASTER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden rounded-full bg-brand px-5 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-brand transition-all duration-200 hover:bg-brand-hover hover:scale-[1.03] md:inline-flex"
                    >
                        Join Now
                    </a>
                    <button
                        className={cn(ICON_BUTTON, "md:hidden")}
                        aria-label="Toggle menu"
                        onClick={() => setOpen((v) => !v)}
                    >
                        {open ? <X className="size-4" /> : <Menu className="size-4" />}
                    </button>
                </div>
            </div>

            <div
                className={cn(
                    "grid overflow-hidden bg-background/95 shadow-elevated backdrop-blur-xl transition-[grid-template-rows,opacity] duration-300 md:hidden",
                    open
                        ? "grid-rows-[1fr] border-t border-border opacity-100"
                        : "grid-rows-[0fr] border-t border-transparent opacity-0",
                )}
            >
                <div className="overflow-hidden">
                    <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
                        {links.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    MOBILE_NAV_LINK_BASE,
                                    isActive(currentPath, l.href) ? MOBILE_NAV_LINK_ACTIVE : MOBILE_NAV_LINK_INACTIVE,
                                )}
                            >
                                {l.label}
                            </Link>
                        ))}
                        <a
                            href={GYM_MASTER_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="mt-2 rounded-full bg-brand px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-white shadow-brand"
                        >
                            Join Now
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
}
```

- [ ] **Step 5: Port `SiteFooter` (routing swapped for Inertia)**

Source: `GC-Fitness-Rebrand/src/components/site-footer.tsx`. Only change: `Link to`→`Link href`. Content (address, phone, email, social icon hrefs) stays hardcoded exactly as in the source for this task — Task 9's `SiteSetting` model centralizes the address/phone/email for the Contact page, but the footer keeps its own copy of the same values verbatim here to match the source 1:1 (both already agree: "128 Mercer Street, New York, NY 10012", "+1 (212) 555-0142", "hello@gcfitness.club"). Create `resources/js/Components/SiteFooter.jsx`:

```jsx
import { Link } from "@inertiajs/react";
import { Instagram, Youtube, Twitter, MapPin, Phone, Mail } from "lucide-react";

export function SiteFooter() {
    return (
        <footer className="relative overflow-hidden border-t border-border bg-surface">
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[70%] -translate-x-1/2 bg-brand-radial opacity-40 blur-3xl" />
            <div className="relative mx-auto max-w-7xl px-6 py-20">
                <div className="mb-16 grid gap-8 rounded-2xl border border-border bg-card/60 p-8 md:grid-cols-[1.4fr_1fr] md:p-12">
                    <div>
                        <h3 className="font-display text-3xl font-semibold md:text-4xl">Join the movement.</h3>
                        <p className="mt-3 max-w-md text-sm text-muted-foreground">
                            Training drops, coach interviews, member stories. No spam — just signal.
                        </p>
                    </div>
                    <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            required
                            placeholder="you@performance.com"
                            className="h-12 w-full rounded-full border border-border bg-background px-5 text-sm outline-none placeholder:text-muted-foreground focus:border-brand sm:flex-1"
                        />
                        <button
                            type="submit"
                            className="h-12 w-full shrink-0 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-hover sm:w-auto"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>

                <div className="grid gap-12 md:grid-cols-4">
                    <div className="md:col-span-1">
                        <Link href="/" className="font-hero text-3xl tracking-widest">
                            GC<span className="text-brand">Fitness</span>
                        </Link>
                        <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                            A performance club for people who train with intent. Members only.
                        </p>
                        <div className="mt-6 flex gap-3">
                            {[Instagram, Youtube, Twitter].map((Icon, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    aria-label="Social"
                                    className="grid size-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-brand hover:text-brand"
                                >
                                    <Icon className="size-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    <FooterCol
                        title="Train"
                        items={[
                            ["Programs", "/programs"],
                            ["Personal Training", "/programs"],
                            ["Classes", "/programs"],
                            ["Membership", "/membership"],
                        ]}
                    />
                    <FooterCol
                        title="Club"
                        items={[
                            ["About", "/about"],
                            ["Trainers", "/about"],
                            ["Contact", "/contact"],
                            ["Careers", "/contact"],
                        ]}
                    />

                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">Visit</h4>
                        <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
                            <li className="flex gap-3">
                                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                                <span>128 Mercer Street<br />New York, NY 10012</span>
                            </li>
                            <li className="flex gap-3">
                                <Phone className="mt-0.5 size-4 shrink-0 text-brand" />
                                <span>+1 (212) 555-0142</span>
                            </li>
                            <li className="flex gap-3">
                                <Mail className="mt-0.5 size-4 shrink-0 text-brand" />
                                <span>hello@gcfitness.club</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        © {new Date().getFullYear()} GCFitness Performance Club. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-xs uppercase tracking-widest text-muted-foreground">
                        <a href="#" className="hover:text-foreground">Privacy</a>
                        <a href="#" className="hover:text-foreground">Terms</a>
                        <a href="#" className="hover:text-foreground">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterCol({ title, items }) {
    return (
        <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground">{title}</h4>
            <ul className="mt-5 space-y-3">
                {items.map(([label, href]) => (
                    <li key={label}>
                        <Link href={href} className="text-sm text-muted-foreground transition hover:text-brand">
                            {label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

- [ ] **Step 6: Verify**

Run: `npm run build`

Expected: succeeds with no errors (nothing renders these yet — Task 6 wires them in).

- [ ] **Step 7: Commit**

```bash
git add resources/js/Components
git commit -m "feat: port GCFitness shared layout components"
```

---

## Task 6: SiteLayout wiring and foundation checkpoint

Assembles Tasks 2–5 into the persistent Inertia layout that replaces the tutorial's `Layouts.jsx`, matching the source app's `__root.tsx` `RootComponent` (preloader → route loader → nav → page content → footer → scroll-to-top, all inside the theme provider). Verifies the whole visual foundation with a throwaway placeholder page before any real page is built.

**Files:**
- Modify: `resources/js/Layouts/Layouts.jsx`
- Modify: `resources/js/app.jsx`
- Create (temporary, deleted in Step 4): `resources/js/Pages/FoundationCheck.jsx`
- Modify (temporary, reverted in Step 4): `routes/web.php`

**Interfaces:**
- Consumes: `ThemeProvider`/`useTheme` (Task 4), `SiteNav`, `SiteFooter`, `Preloader`, `RouteLoader`, `ScrollToTop` (Task 5).
- Produces: the default Inertia layout every page in Tasks 16–20 renders inside (via `app.jsx`'s existing `page.default.layout` fallback — no per-page changes needed).

- [ ] **Step 1: Rewrite the layout**

Source pattern: `GC-Fitness-Rebrand/src/routes/__root.tsx`'s `RootComponent` (the non-admin branch only — this project has no admin routes in this phase). Replace `resources/js/Layouts/Layouts.jsx` entirely:

```jsx
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/Components/ThemeProvider";
import { Preloader } from "@/Components/Preloader";
import { RouteLoader } from "@/Components/RouteLoader";
import { SiteNav } from "@/Components/SiteNav";
import { SiteFooter } from "@/Components/SiteFooter";
import { ScrollToTop } from "@/Components/ScrollToTop";

export default function SiteLayout({ children }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <ThemeProvider>
            <Preloader />
            <RouteLoader />
            <SiteNav scrolled={scrolled} />
            <main className="min-h-screen">{children}</main>
            <SiteFooter />
            <ScrollToTop />
        </ThemeProvider>
    );
}
```

- [ ] **Step 2: Point `app.jsx` at the renamed component**

`resources/js/app.jsx` already imports `Layout from "@/Layouts/Layouts"` and applies it as the default per-page layout — no change needed there. Open the file and confirm the import line still reads:

```js
import Layout from "@/Layouts/Layouts";
```

(It does — `Layouts.jsx` keeps its filename and default export; only its internal implementation changed in Step 1.)

- [ ] **Step 3: Build a throwaway placeholder page and route to verify the foundation**

Create `resources/js/Pages/FoundationCheck.jsx`:

```jsx
import { Head } from "@inertiajs/react";
import { Reveal } from "@/Components/Reveal";

export default function FoundationCheck() {
    return (
        <>
            <Head title="Foundation Check" />
            <div className="mx-auto max-w-3xl px-6 py-32 text-center">
                <Reveal>
                    <h1 className="font-hero text-6xl uppercase text-foreground">
                        GC<span className="text-brand">Fitness</span> foundation check
                    </h1>
                    <p className="mt-6 text-muted-foreground">
                        If you can see the brand font, the pink brand color, and this text fades in on
                        load, the theme, fonts, nav, and footer are wired correctly.
                    </p>
                </Reveal>
            </div>
        </>
    );
}
```

Temporarily add to `routes/web.php`:

```php
Route::get('/foundation-check', fn () => inertia('FoundationCheck'));
```

- [ ] **Step 4: Verify in the browser, then remove the throwaway page**

Run `npm run dev` and `php artisan serve`, visit `/foundation-check`, and confirm all of the following:
- The preloader briefly appears then fades out.
- "Bebas Neue" renders for the "GCFitness foundation check" heading (not a fallback sans-serif).
- The nav bar is fixed to the top, shows "GCFitness", the 5 nav links, a theme toggle button, and a "Join Now" button.
- Clicking the theme toggle switches between the dark theme (near-black background) and the light theme (warm cream background) and persists across a page refresh.
- The heading and paragraph fade/slide in shortly after the page loads (the `Reveal` intersection-observer animation).
- The footer renders at the bottom with the newsletter block, link columns, and visit info.
- Scrolling down past one viewport height reveals the scroll-to-top button in the bottom-right corner, and clicking it smooth-scrolls to the top.

Once confirmed, delete `resources/js/Pages/FoundationCheck.jsx` and remove the `/foundation-check` route from `routes/web.php` (restore it to just the `use` statement, as Task 1 left it).

- [ ] **Step 5: Commit**

```bash
git add resources/js/Layouts/Layouts.jsx
git commit -m "feat: wire GCFitness site layout (nav, footer, theme, preloader)"
```

---

## Task 7: Program model

Programs appear on both the Home page (a 6-item featured preview with shorter copy) and the dedicated Programs page (the full 8-item catalog with fuller copy). Content pulled directly from `GC-Fitness-Rebrand/src/routes/index.tsx`'s `Programs()` component and `GC-Fitness-Rebrand/src/routes/programs.tsx`'s `programs` array.

**Files:**
- Create: `database/migrations/2026_09_02_000001_create_programs_table.php`
- Create: `app/Models/Program.php`
- Create: `database/seeders/ProgramSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `Program` model with columns `title, tag, duration, level, description, home_description (nullable), image_path, featured (bool), sort_order`. Consumed by Task 16 (Home) via `Program::where('featured', true)->orderBy('sort_order')->get()` and Task 18 (Programs page) via `Program::orderBy('sort_order')->get()`.

- [ ] **Step 1: Create the migration**

Run: `php artisan make:migration create_programs_table`

Replace its contents:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('tag');
            $table->string('duration');
            $table->string('level');
            $table->text('description');
            $table->text('home_description')->nullable();
            $table->string('image_path');
            $table->boolean('featured')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programs');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/Program.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    protected $fillable = [
        'title',
        'tag',
        'duration',
        'level',
        'description',
        'home_description',
        'image_path',
        'featured',
        'sort_order',
    ];

    protected $casts = [
        'featured' => 'boolean',
    ];
}
```

- [ ] **Step 3: Create the seeder with the exact site content**

Create `database/seeders/ProgramSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {
        $programs = [
            ['title' => 'Bodybuilding', 'tag' => 'Hypertrophy', 'duration' => '60 min', 'level' => 'Intermediate', 'image_path' => '/images/programs/bodybuilding.jpg', 'featured' => true, 'home_description' => 'Structural hypertrophy for lean mass development.', 'description' => 'Structural hypertrophy for lean mass development. Split routines, progressive overload, and periodized blocks.'],
            ['title' => 'Powerlifting', 'tag' => 'Power', 'duration' => '75 min', 'level' => 'Advanced', 'image_path' => '/images/programs/strength.jpg', 'featured' => true, 'home_description' => 'Squat, bench, deadlift — engineered progression.', 'description' => 'Squat, bench, deadlift. Engineered progression toward your one-rep max under expert supervision.'],
            ['title' => 'HIIT Surge', 'tag' => 'Conditioning', 'duration' => '45 min', 'level' => 'All levels', 'image_path' => '/images/programs/hiit.jpg', 'featured' => true, 'home_description' => 'High-output intervals for metabolic peak.', 'description' => 'High-output intervals for metabolic peak. Heart rate targets, precise work-to-rest, real results.'],
            ['title' => 'Functional Flow', 'tag' => 'Mobility', 'duration' => '50 min', 'level' => 'All levels', 'image_path' => '/images/programs/functional.jpg', 'featured' => true, 'home_description' => 'Mobility and power integrated into movement.', 'description' => 'Kettlebells, medicine balls, sleds. Mobility and power integrated into daily movement patterns.'],
            ['title' => 'Boxing Studio', 'tag' => 'Cardio', 'duration' => '50 min', 'level' => 'Intermediate', 'image_path' => '/images/programs/boxing.jpg', 'featured' => true, 'home_description' => 'Rounds programmed by former pro fighters.', 'description' => 'Rounds programmed by former pro fighters. Bag work, mitts, and full sparring for members.'],
            ['title' => 'Vinyasa & Yin', 'tag' => 'Recovery', 'duration' => '60 min', 'level' => 'All levels', 'image_path' => '/images/programs/yoga.jpg', 'featured' => true, 'home_description' => 'Restorative flows to complement heavy training.', 'description' => 'Restorative flows and deep stretch to complement heavy training. Breath, mobility, calm.'],
            ['title' => 'Ignite', 'tag' => 'Weight Loss', 'duration' => '55 min', 'level' => 'Beginner', 'image_path' => '/images/programs/functional.jpg', 'featured' => false, 'home_description' => null, 'description' => 'A structured 12-week fat-loss protocol combining conditioning and nutrition coaching.'],
            ['title' => "Women's Strength", 'tag' => "Women's", 'duration' => '50 min', 'level' => 'All levels', 'image_path' => '/images/programs/hiit.jpg', 'featured' => false, 'home_description' => null, 'description' => 'Female-focused strength programming led by top coaches in a supportive environment.'],
        ];

        foreach ($programs as $i => $program) {
            Program::create($program + ['sort_order' => $i + 1]);
        }
    }
}
```

- [ ] **Step 4: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, inside the `run()` method, add:

```php
$this->call([
    ProgramSeeder::class,
]);
```

(If `DatabaseSeeder::run()` doesn't yet have a `$this->call([...])` block, add one with just this line for now — later tasks append to the same array.)

- [ ] **Step 5: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\Program::count() . ' programs, ' . App\Models\Program::where('featured', true)->count() . ' featured';"`

Expected output: `8 programs, 6 featured`

- [ ] **Step 6: Commit**

```bash
git add database/migrations database/seeders app/Models/Program.php
git commit -m "feat: add Program model, migration, and seeder"
```

---

## Task 8: Trainer model

The same 4 trainers appear on Home (abbreviated card: photo, name, specialty, years) and About (full profile: adds bio and certifications). Content pulled from `GC-Fitness-Rebrand/src/routes/index.tsx`'s `Trainers()` component and `GC-Fitness-Rebrand/src/routes/about.tsx`'s `trainers` array — the two lists describe the same 4 people with matching names/specialties/years, so this is one table, not two.

**Files:**
- Create: `database/migrations/2026_09_02_000002_create_trainers_table.php`
- Create: `app/Models/Trainer.php`
- Create: `database/seeders/TrainerSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `Trainer` model with columns `name, specialty, years_experience, bio (nullable), certifications (JSON array), image_path, sort_order`. Consumed by Task 16 (Home) and Task 17 (About), both via `Trainer::orderBy('sort_order')->get()`.

- [ ] **Step 1: Create the migration**

Run: `php artisan make:migration create_trainers_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trainers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('specialty');
            $table->string('years_experience');
            $table->text('bio')->nullable();
            $table->json('certifications')->nullable();
            $table->string('image_path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trainers');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/Trainer.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trainer extends Model
{
    protected $fillable = [
        'name',
        'specialty',
        'years_experience',
        'bio',
        'certifications',
        'image_path',
        'sort_order',
    ];

    protected $casts = [
        'certifications' => 'array',
    ];
}
```

- [ ] **Step 3: Create the seeder**

Create `database/seeders/TrainerSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Trainer;
use Illuminate\Database\Seeder;

class TrainerSeeder extends Seeder
{
    public function run(): void
    {
        $trainers = [
            ['name' => 'Marcus Vale', 'specialty' => 'Head of Performance', 'years_experience' => '12', 'image_path' => '/images/trainers/trainer-1.jpg', 'bio' => 'Former Olympic S&C coach. Specializes in athletic performance and hypertrophy programming.', 'certifications' => ['NSCA-CSCS', 'USAW L2', 'FMS']],
            ['name' => 'Ana Ribeiro', 'specialty' => 'Strength & Conditioning', 'years_experience' => '9', 'image_path' => '/images/trainers/trainer-2.jpg', 'bio' => 'Ex-national judo athlete turned coach. Builds functional strength for real-world capacity.', 'certifications' => ['NASM-CPT', 'PN L1', 'USAW L1']],
            ['name' => 'Jonah Reed', 'specialty' => 'Bodybuilding Coach', 'years_experience' => '14', 'image_path' => '/images/trainers/trainer-3.jpg', 'bio' => 'IFBB-qualified competitor. Twenty years of tuning physiques for stage and life.', 'certifications' => ['ISSA', 'PN L2', 'IFBB']],
            ['name' => 'Lena Osei', 'specialty' => 'Mobility & Recovery', 'years_experience' => '8', 'image_path' => '/images/trainers/trainer-4.jpg', 'bio' => "Movement therapist and yoga instructor. The reason members stay injury-free.", 'certifications' => ['FRC', 'RYT-500', 'NKT L2']],
        ];

        foreach ($trainers as $i => $trainer) {
            Trainer::create($trainer + ['sort_order' => $i + 1]);
        }
    }
}
```

- [ ] **Step 4: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `TrainerSeeder::class` to the `$this->call([...])` array from Task 7.

- [ ] **Step 5: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\Trainer::count() . ' trainers'; echo PHP_EOL; print_r(App\Models\Trainer::first()->certifications);"`

Expected: `4 trainers` followed by an array printout containing `NSCA-CSCS`, `USAW L2`, `FMS` (confirms the JSON cast works).

- [ ] **Step 6: Commit**

```bash
git add database/migrations database/seeders app/Models/Trainer.php
git commit -m "feat: add Trainer model, migration, and seeder"
```

---

## Task 9: Testimonial model

Home and About each show 3 distinct testimonials — genuinely different quotes, not the same content reused, so a single table with a `page` discriminator column matches reality (this mirrors the shape already used by `GC-Fitness-Rebrand/src/lib/admin-api/types.ts`'s `Testimonial`/`TestimonialPage`, which fits here without modification). Content from `GC-Fitness-Rebrand/src/routes/index.tsx`'s `Testimonials()` and `GC-Fitness-Rebrand/src/routes/about.tsx`'s `testimonials` array.

**Files:**
- Create: `database/migrations/2026_09_02_000003_create_testimonials_table.php`
- Create: `app/Models/Testimonial.php`
- Create: `database/seeders/TestimonialSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `Testimonial` model with columns `quote, name, role, page ('home'|'about'), sort_order`. Consumed by Task 16 (Home) via `Testimonial::where('page', 'home')->orderBy('sort_order')->get()` and Task 17 (About) via `where('page', 'about')`.

- [ ] **Step 1: Create the migration**

Run: `php artisan make:migration create_testimonials_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->text('quote');
            $table->string('name');
            $table->string('role');
            $table->enum('page', ['home', 'about']);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/Testimonial.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    protected $fillable = ['quote', 'name', 'role', 'page', 'sort_order'];
}
```

- [ ] **Step 3: Create the seeder**

Create `database/seeders/TestimonialSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class TestimonialSeeder extends Seeder
{
    public function run(): void
    {
        $home = [
            ['name' => 'Daniel R.', 'role' => 'Member since 2023', 'quote' => "GCFitness isn't a gym. It's a discipline. Six months in and I've never felt sharper — physically or mentally."],
            ['name' => 'Priya S.', 'role' => 'Powerlifter', 'quote' => 'The coaches treat programming like science. Every block builds on the last. My strength numbers speak for themselves.'],
            ['name' => 'Marco B.', 'role' => 'Member since 2022', 'quote' => 'The recovery zone alone is worth it. Cryo, sauna, mobility — nothing left to chance.'],
        ];

        $about = [
            ['name' => 'Elena K.', 'role' => 'Member since 2019', 'quote' => "The programming turned me from a hobbyist into someone who competes. I've never trained with a smarter team."],
            ['name' => 'James O.', 'role' => 'Member since 2021', 'quote' => 'The recovery zone alone is worth the membership. But the coaches — the coaches are the reason I stay.'],
            ['name' => 'Priya S.', 'role' => 'Member since 2018', 'quote' => "GCFitness built a room that treats you like a professional athlete, whether or not you are one. It's rare."],
        ];

        foreach ($home as $i => $t) {
            Testimonial::create($t + ['page' => 'home', 'sort_order' => $i + 1]);
        }
        foreach ($about as $i => $t) {
            Testimonial::create($t + ['page' => 'about', 'sort_order' => $i + 1]);
        }
    }
}
```

- [ ] **Step 4: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `TestimonialSeeder::class` to the `$this->call([...])` array.

- [ ] **Step 5: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\Testimonial::where('page','home')->count() . ' home, ' . App\Models\Testimonial::where('page','about')->count() . ' about';"`

Expected: `3 home, 3 about`

- [ ] **Step 6: Commit**

```bash
git add database/migrations database/seeders app/Models/Testimonial.php
git commit -m "feat: add Testimonial model, migration, and seeder"
```

---

## Task 10: Faq model

Membership and Contact each show their own distinct set of FAQs. Same pattern as Testimonial: one table, a `page` discriminator. Content from `GC-Fitness-Rebrand/src/routes/membership.tsx`'s `faqs` array and `GC-Fitness-Rebrand/src/routes/contact.tsx`'s `faqs` array.

**Files:**
- Create: `database/migrations/2026_09_02_000004_create_faqs_table.php`
- Create: `app/Models/Faq.php`
- Create: `database/seeders/FaqSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `Faq` model with columns `question, answer, page ('contact'|'membership'), sort_order`. Consumed by Task 19 (Membership) and Task 20 (Contact).

- [ ] **Step 1: Create the migration**

Run: `php artisan make:migration create_faqs_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->text('answer');
            $table->enum('page', ['contact', 'membership']);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faqs');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/Faq.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    protected $fillable = ['question', 'answer', 'page', 'sort_order'];
}
```

- [ ] **Step 3: Create the seeder**

Create `database/seeders/FaqSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $membership = [
            ['question' => 'Is there a minimum commitment?', 'answer' => "No. All plans are month-to-month. Cancel anytime with 30 days' notice."],
            ['question' => 'Can I freeze my membership?', 'answer' => 'Yes — up to 3 months per year at no charge. Perfect for travel or recovery.'],
            ['question' => 'Do you offer corporate memberships?', 'answer' => 'We do. Volume pricing starts at 10 employees. Contact us for a proposal.'],
            ['question' => "What's included in the free trial?", 'answer' => 'Two full weeks of unlimited access, group classes, and one 1-on-1 coach consultation.'],
        ];

        $contact = [
            ['question' => 'How fast do you respond?', 'answer' => 'Within one business day, often within a few hours during club hours.'],
            ['question' => 'Can I visit without a membership?', 'answer' => 'Yes — free tours daily, and every new member gets a two-week free trial.'],
            ['question' => 'Do you accept corporate wellness plans?', 'answer' => 'We partner with select corporate wellness programs. Ask us for a list.'],
        ];

        foreach ($membership as $i => $f) {
            Faq::create($f + ['page' => 'membership', 'sort_order' => $i + 1]);
        }
        foreach ($contact as $i => $f) {
            Faq::create($f + ['page' => 'contact', 'sort_order' => $i + 1]);
        }
    }
}
```

- [ ] **Step 4: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `FaqSeeder::class` to the `$this->call([...])` array.

- [ ] **Step 5: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\Faq::where('page','membership')->count() . ' membership, ' . App\Models\Faq::where('page','contact')->count() . ' contact';"`

Expected: `4 membership, 3 contact`

- [ ] **Step 6: Commit**

```bash
git add database/migrations database/seeders app/Models/Faq.php
git commit -m "feat: add Faq model, migration, and seeder"
```

---

## Task 11: ClubLocation model

Powers the Contact page's "Our clubs" grid. Content from `GC-Fitness-Rebrand/src/routes/contact.tsx`'s `clubs` array.

**Files:**
- Create: `database/migrations/2026_09_02_000005_create_club_locations_table.php`
- Create: `app/Models/ClubLocation.php`
- Create: `database/seeders/ClubLocationSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `ClubLocation` model with columns `name, address, hours, sort_order`. Consumed by Task 20 (Contact) via `ClubLocation::orderBy('sort_order')->get()`.

- [ ] **Step 1: Create the migration**

Run: `php artisan make:migration create_club_locations_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('club_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('address');
            $table->string('hours');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('club_locations');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/ClubLocation.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClubLocation extends Model
{
    protected $fillable = ['name', 'address', 'hours', 'sort_order'];
}
```

- [ ] **Step 3: Create the seeder**

Create `database/seeders/ClubLocationSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\ClubLocation;
use Illuminate\Database\Seeder;

class ClubLocationSeeder extends Seeder
{
    public function run(): void
    {
        $clubs = [
            ['name' => 'Mercer', 'address' => '128 Mercer Street, New York, NY 10012', 'hours' => 'Members: 24/7 · Reception 6a–10p'],
            ['name' => 'Brooklyn', 'address' => '402 Kent Avenue, Brooklyn, NY 11249', 'hours' => 'Members: 24/7 · Reception 6a–9p'],
            ['name' => 'Miami', 'address' => '1450 Collins Avenue, Miami Beach, FL', 'hours' => 'Members: 24/7 · Reception 6a–10p'],
        ];

        foreach ($clubs as $i => $c) {
            ClubLocation::create($c + ['sort_order' => $i + 1]);
        }
    }
}
```

- [ ] **Step 4: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `ClubLocationSeeder::class` to the `$this->call([...])` array.

- [ ] **Step 5: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\ClubLocation::count() . ' clubs';"`

Expected: `3 clubs`

- [ ] **Step 6: Commit**

```bash
git add database/migrations database/seeders app/Models/ClubLocation.php
git commit -m "feat: add ClubLocation model, migration, and seeder"
```

---

## Task 12: Partner model

Powers the Home page's scrolling "Trusted equipment & partners" logo marquee. The source app renders these as unlabeled logos (`alt=""`, `aria-hidden`) — no partner name is ever shown to visitors — so `name` exists only as an internal reference field for a future admin CMS, not for display. Content from `GC-Fitness-Rebrand/src/routes/index.tsx`'s `TrustedBy()`/`logos` array.

**Files:**
- Create: `database/migrations/2026_09_02_000006_create_partners_table.php`
- Create: `app/Models/Partner.php`
- Create: `database/seeders/PartnerSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `Partner` model with columns `name, logo_path, sort_order`. Consumed by Task 16 (Home) via `Partner::orderBy('sort_order')->get()`.

- [ ] **Step 1: Create the migration**

Run: `php artisan make:migration create_partners_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('logo_path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('partners');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/Partner.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    protected $fillable = ['name', 'logo_path', 'sort_order'];
}
```

- [ ] **Step 3: Create the seeder**

The source app's own logo files are numbered 1–16 with 5, 11, and 13 missing (never introduced, not deleted) — the seeder reproduces that exact set and order. Create `database/seeders/PartnerSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Partner;
use Illuminate\Database\Seeder;

class PartnerSeeder extends Seeder
{
    public function run(): void
    {
        $numbers = [1, 2, 3, 4, 6, 7, 8, 9, 10, 12, 14, 15, 16];

        foreach ($numbers as $i => $n) {
            Partner::create([
                'name' => "Partner {$n}",
                'logo_path' => "/images/partners/partner{$n}.png",
                'sort_order' => $i + 1,
            ]);
        }
    }
}
```

- [ ] **Step 4: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `PartnerSeeder::class` to the `$this->call([...])` array.

- [ ] **Step 5: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\Partner::count() . ' partners';"`

Expected: `13 partners`

- [ ] **Step 6: Commit**

```bash
git add database/migrations database/seeders app/Models/Partner.php
git commit -m "feat: add Partner model, migration, and seeder"
```

---

## Task 13: MembershipPlan model

Home's Membership preview and the dedicated Membership page both show Essential/Performance/Elite at the same prices, but with different-length feature lists (the Membership page's lists are supersets with 1 extra item each) — same "exact replication" treatment as Task 7's Program descriptions: both lists are stored. Content from `GC-Fitness-Rebrand/src/routes/index.tsx`'s `Membership()` and `GC-Fitness-Rebrand/src/routes/membership.tsx`'s `plans` array.

**Files:**
- Create: `database/migrations/2026_09_02_000007_create_membership_plans_table.php`
- Create: `app/Models/MembershipPlan.php`
- Create: `database/seeders/MembershipPlanSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `MembershipPlan` model with columns `name, monthly_price, annual_price, popular (bool), home_features (JSON array), features (JSON array), sort_order`. Consumed by Task 16 (Home) and Task 19 (Membership), both via `MembershipPlan::orderBy('sort_order')->get()`.

- [ ] **Step 1: Create the migration**

Run: `php artisan make:migration create_membership_plans_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('monthly_price');
            $table->unsignedInteger('annual_price');
            $table->boolean('popular')->default(false);
            $table->json('home_features');
            $table->json('features');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_plans');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/MembershipPlan.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MembershipPlan extends Model
{
    protected $fillable = [
        'name',
        'monthly_price',
        'annual_price',
        'popular',
        'home_features',
        'features',
        'sort_order',
    ];

    protected $casts = [
        'popular' => 'boolean',
        'home_features' => 'array',
        'features' => 'array',
    ];
}
```

- [ ] **Step 3: Create the seeder**

Create `database/seeders/MembershipPlanSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\MembershipPlan;
use Illuminate\Database\Seeder;

class MembershipPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Essential',
                'monthly_price' => 85,
                'annual_price' => 72,
                'popular' => false,
                'home_features' => ['Unlimited Club Access', 'Standard Locker', 'Biometric Entry', 'Mobile App'],
                'features' => ['Unlimited Club Access', 'Standard Locker', 'Biometric Entry', 'Mobile App', 'Group Classes (5/mo)'],
            ],
            [
                'name' => 'Performance',
                'monthly_price' => 140,
                'annual_price' => 119,
                'popular' => true,
                'home_features' => ['Everything in Essential', 'Weekly Master Classes', 'Recovery Zone', 'Coach Portal', '2 Guest Passes / mo'],
                'features' => ['Everything in Essential', 'Unlimited Group Classes', 'Recovery Zone (Sauna, Cryo)', 'Coach Portal', 'Guest Passes (2/mo)', 'Nutrition Consultation'],
            ],
            [
                'name' => 'Elite',
                'monthly_price' => 290,
                'annual_price' => 247,
                'popular' => false,
                'home_features' => ['Everything in Performance', '1-on-1 Nutritionist', 'Priority Booking', 'Private Locker & Laundry', 'Concierge Support'],
                'features' => ['Everything in Performance', '1-on-1 Nutritionist', '4× Personal Training / mo', 'Priority Booking', 'Private Locker & Laundry', 'Concierge Support'],
            ],
        ];

        foreach ($plans as $i => $plan) {
            MembershipPlan::create($plan + ['sort_order' => $i + 1]);
        }
    }
}
```

- [ ] **Step 4: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `MembershipPlanSeeder::class` to the `$this->call([...])` array.

- [ ] **Step 5: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\MembershipPlan::count() . ' plans'; echo PHP_EOL; print_r(App\Models\MembershipPlan::where('name','Essential')->first()->features);"`

Expected: `3 plans` followed by a 5-element array ending in `Group Classes (5/mo)`.

- [ ] **Step 6: Commit**

```bash
git add database/migrations database/seeders app/Models/MembershipPlan.php
git commit -m "feat: add MembershipPlan model, migration, and seeder"
```

---

## Task 14: Stat model

The source app displays "stat" numbers in three places that look similar but are genuinely different datasets: Home's hero has 4 small chips (Years/Members/Coaches/Programs, e.g. "12+", "12k"); Home's mid-page "Our impact" section has 4 different, larger animated counters (Happy Members/Elite Coaches/Classes Monthly/Satisfaction, e.g. counting up to `12000` with a `+` suffix); About's "impact" section has yet another 4 (Members/Elite coaches/**Flagship clubs**/Retention) as pre-formatted strings like `"12,000+"` with no separate suffix. These don't share a fixed set of named fields, so — matching the "exact replication" principle from Task 7 — this is one flexible table keyed by `page` + `section`, not a rigid `CompanyStats`-style singleton. Content from `GC-Fitness-Rebrand/src/routes/index.tsx`'s `StatChips()` and `Stats()`, and `GC-Fitness-Rebrand/src/routes/about.tsx`'s `stats` array.

**Files:**
- Create: `database/migrations/2026_09_02_000008_create_stats_table.php`
- Create: `app/Models/Stat.php`
- Create: `database/seeders/StatSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `Stat` model with columns `page ('home'|'about'), section ('hero'|'impact'), label, value, suffix (nullable), sort_order`. Consumed by Task 16 (Home, both `page=home, section=hero` and `page=home, section=impact`) and Task 17 (About, `page=about, section=impact`), all via `Stat::where('page', ...)->where('section', ...)->orderBy('sort_order')->get()`.

- [ ] **Step 1: Create the migration**

Run: `php artisan make:migration create_stats_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stats', function (Blueprint $table) {
            $table->id();
            $table->enum('page', ['home', 'about']);
            $table->enum('section', ['hero', 'impact']);
            $table->string('label');
            $table->string('value');
            $table->string('suffix')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stats');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/Stat.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Stat extends Model
{
    protected $fillable = ['page', 'section', 'label', 'value', 'suffix', 'sort_order'];
}
```

- [ ] **Step 3: Create the seeder**

Create `database/seeders/StatSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\Stat;
use Illuminate\Database\Seeder;

class StatSeeder extends Seeder
{
    public function run(): void
    {
        $homeHero = [
            ['label' => 'Years', 'value' => '12', 'suffix' => '+'],
            ['label' => 'Members', 'value' => '12', 'suffix' => 'k'],
            ['label' => 'Coaches', 'value' => '24', 'suffix' => ''],
            ['label' => 'Programs', 'value' => '8', 'suffix' => ''],
        ];

        $homeImpact = [
            ['label' => 'Happy Members', 'value' => '12000', 'suffix' => '+'],
            ['label' => 'Elite Coaches', 'value' => '50', 'suffix' => '+'],
            ['label' => 'Classes Monthly', 'value' => '200', 'suffix' => ''],
            ['label' => 'Satisfaction', 'value' => '98', 'suffix' => '%'],
        ];

        $aboutImpact = [
            ['label' => 'Members', 'value' => '12,000+', 'suffix' => null],
            ['label' => 'Elite coaches', 'value' => '50+', 'suffix' => null],
            ['label' => 'Flagship clubs', 'value' => '3', 'suffix' => null],
            ['label' => 'Retention', 'value' => '98%', 'suffix' => null],
        ];

        foreach ($homeHero as $i => $s) {
            Stat::create($s + ['page' => 'home', 'section' => 'hero', 'sort_order' => $i + 1]);
        }
        foreach ($homeImpact as $i => $s) {
            Stat::create($s + ['page' => 'home', 'section' => 'impact', 'sort_order' => $i + 1]);
        }
        foreach ($aboutImpact as $i => $s) {
            Stat::create($s + ['page' => 'about', 'section' => 'impact', 'sort_order' => $i + 1]);
        }
    }
}
```

- [ ] **Step 4: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `StatSeeder::class` to the `$this->call([...])` array.

- [ ] **Step 5: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\Stat::where('page','home')->where('section','hero')->count() . '/' . App\Models\Stat::where('page','home')->where('section','impact')->count() . '/' . App\Models\Stat::where('page','about')->count();"`

Expected: `4/4/4`

- [ ] **Step 6: Commit**

```bash
git add database/migrations database/seeders app/Models/Stat.php
git commit -m "feat: add Stat model, migration, and seeder"
```

---

## Task 15: SiteSetting model

A single-row settings table for the contact details shown on the Contact page's info cards (`GC-Fitness-Rebrand/src/routes/contact.tsx`'s `InfoCard` block). The footer (Task 5) keeps its own hardcoded copy of the same values per the source app's own pattern — the two already agree, and centralizing them isn't needed for phase 1's scope.

**Files:**
- Create: `database/migrations/2026_09_02_000009_create_site_settings_table.php`
- Create: `app/Models/SiteSetting.php`
- Create: `database/seeders/SiteSettingSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `SiteSetting` model (single row, id 1) with columns `address_line1, address_line2, phone, email, hours`. Consumed by Task 20 (Contact) via `SiteSetting::first()`.

- [ ] **Step 1: Create the migration**

Run: `php artisan make:migration create_site_settings_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_settings', function (Blueprint $table) {
            $table->id();
            $table->string('address_line1');
            $table->string('address_line2');
            $table->string('phone');
            $table->string('email');
            $table->string('hours');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
```

- [ ] **Step 2: Create the model**

Create `app/Models/SiteSetting.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['address_line1', 'address_line2', 'phone', 'email', 'hours'];
}
```

- [ ] **Step 3: Create the seeder**

Create `database/seeders/SiteSettingSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\SiteSetting;
use Illuminate\Database\Seeder;

class SiteSettingSeeder extends Seeder
{
    public function run(): void
    {
        SiteSetting::create([
            'address_line1' => '128 Mercer Street',
            'address_line2' => 'New York, NY 10012',
            'phone' => '+1 (212) 555-0142',
            'email' => 'hello@gcfitness.club',
            'hours' => 'Members: 24/7 · Reception: 6am — 10pm',
        ]);
    }
}
```

- [ ] **Step 4: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `SiteSettingSeeder::class` to the `$this->call([...])` array. This closes out the data layer — the full array should now read:

```php
$this->call([
    ProgramSeeder::class,
    TrainerSeeder::class,
    TestimonialSeeder::class,
    FaqSeeder::class,
    ClubLocationSeeder::class,
    PartnerSeeder::class,
    MembershipPlanSeeder::class,
    StatSeeder::class,
    SiteSettingSeeder::class,
]);
```

- [ ] **Step 5: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\SiteSetting::first()->email;"`

Expected: `hello@gcfitness.club`

- [ ] **Step 6: Commit**

```bash
git add database/migrations database/seeders app/Models/SiteSetting.php
git commit -m "feat: add SiteSetting model, migration, and seeder"
```

---

## Task 16: Home page

Ports `GC-Fitness-Rebrand/src/routes/index.tsx` (the largest page: hero, trusted-by marquee, why-us grid, how-it-works steps, featured programs, trainers, impact stats, membership preview, testimonials, final CTA). Sections backed by a model (Stat, Partner, Program, Trainer, MembershipPlan, Testimonial) now read from controller props; sections with no CMS-managed content (Why Us, How It Works, Final CTA) stay hardcoded exactly as in the source, matching the scope decided in the spec.

**Files:**
- Create: `app/Http/Controllers/HomeController.php`
- Create: `resources/js/Pages/Home.jsx`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `Stat`, `Partner`, `Program`, `Trainer`, `MembershipPlan`, `Testimonial` models (Tasks 7–14); `Reveal`, `CutoutImage` (Task 5); `resources/js/assets/{hero-home.jpg, about-mission.jpg, gym-girl3.jpg, gym-girl1-removebg-preview.png}` (Task 3).
- Produces: the `/` route.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/HomeController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\MembershipPlan;
use App\Models\Partner;
use App\Models\Program;
use App\Models\Stat;
use App\Models\Testimonial;
use App\Models\Trainer;

class HomeController extends Controller
{
    public function index()
    {
        return inertia('Home', [
            'heroStats' => Stat::where('page', 'home')->where('section', 'hero')->orderBy('sort_order')->get(['label', 'value', 'suffix']),
            'partners' => Partner::orderBy('sort_order')->get(['name', 'logo_path']),
            'programs' => Program::where('featured', true)->orderBy('sort_order')->get(['title', 'tag', 'duration', 'level', 'home_description', 'image_path']),
            'trainers' => Trainer::orderBy('sort_order')->get(['name', 'specialty', 'years_experience', 'image_path']),
            'impactStats' => Stat::where('page', 'home')->where('section', 'impact')->orderBy('sort_order')->get(['label', 'value', 'suffix']),
            'membershipPlans' => MembershipPlan::orderBy('sort_order')->get(['name', 'monthly_price', 'annual_price', 'popular', 'home_features']),
            'testimonials' => Testimonial::where('page', 'home')->orderBy('sort_order')->get(['quote', 'name', 'role']),
        ]);
    }
}
```

- [ ] **Step 2: Add the route**

In `routes/web.php`, add:

```php
use App\Http\Controllers\HomeController;

Route::get('/', [HomeController::class, 'index']);
```

- [ ] **Step 3: Create the page component**

Ports `GC-Fitness-Rebrand/src/routes/index.tsx`. Changes from the source: `createFileRoute`/`Route` export removed in favor of a default-exported component receiving props; `<Link to>` → `<Link href>`; hardcoded `programs`/`trainers`/marquee `logos`/stat arrays replaced with the matching prop; the HowItWorks step that reused `trainer-2.jpg` as decoration now points at its `public/images/trainers/trainer-2.jpg` path directly (a plain string, since that file lives in `public/images` per Task 3, not as a bundled JS asset) instead of a JS import; a `<Head>` block replaces the TanStack root's site-default `<title>`/meta (which this page didn't override in the source, so the values are copied from `GC-Fitness-Rebrand/src/routes/__root.tsx`'s `head()`). Create `resources/js/Pages/Home.jsx`:

```jsx
import { Head, Link } from "@inertiajs/react";
import {
    ArrowRight, Clock, Users, Dumbbell, Sparkles, Salad, Smartphone, ShieldCheck, Flame, Star, Check, Quote,
    ChevronDown, ClipboardCheck, TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/Components/Reveal";
import { CutoutImage } from "@/Components/CutoutImage";

import heroHome from "@/assets/hero-home.jpg";
import aboutMission from "@/assets/about-mission.jpg";
import stepTrackImg from "@/assets/gym-girl3.jpg";
import statsImg from "@/assets/gym-girl1-removebg-preview.png";

const GYM_MASTER_URL = "https://gcfitnesscentre.gymmasteronline.com/portal/login";

export default function Home({ heroStats, partners, programs, trainers, impactStats, membershipPlans, testimonials }) {
    return (
        <>
            <Head title="GCFitness — Premium Performance Training Club">
                <meta
                    name="description"
                    content="GCFitness is a members-only performance club with elite coaches, 24/7 access, and a recovery zone engineered for real results."
                />
            </Head>
            <Hero heroStats={heroStats} />
            <TrustedBy partners={partners} />
            <WhyUs />
            <HowItWorks />
            <Programs programs={programs} />
            <Trainers trainers={trainers} />
            <Stats impactStats={impactStats} />
            <Membership membershipPlans={membershipPlans} />
            <Testimonials testimonials={testimonials} />
            <FinalCTA />
        </>
    );
}

/* -------------------------- HERO -------------------------- */
function Hero({ heroStats }) {
    return (
        <section className="relative overflow-hidden pt-32 pb-20">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
            <div className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-brand/20 blur-[120px] animate-glow-pulse" />

            <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-12">
                <div className="lg:col-span-7">
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 animate-fade-in">
                        <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">
                            New season · Enrollment open
                        </span>
                    </div>

                    <h1 className="mt-6 font-hero text-6xl uppercase leading-[0.9] md:text-8xl lg:text-[7rem] animate-fade-up delay-100">
                        Transform Your Body.
                        <br />
                        <span className="text-gradient-brand">Elevate Your Life.</span>
                    </h1>

                    <p className="mt-6 max-w-xl text-lg text-foreground/80 animate-fade-up delay-200">
                        GCFitness is a members-only performance club engineered around the way you
                        actually train — with elite coaches, 24/7 access, and a recovery zone
                        calibrated for results.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-3 animate-fade-up delay-300">
                        <Link
                            href="/membership"
                            className="group inline-flex h-14 items-center gap-2 rounded-full bg-brand px-8 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-hover"
                        >
                            Join Today
                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <a
                            href="#why-us"
                            className="group inline-flex h-14 items-center gap-2 rounded-full border border-border bg-white/[0.03] px-8 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-white/[0.06]"
                        >
                            See how it works
                            <ChevronDown className="size-4 transition-transform group-hover:translate-y-0.5" />
                        </a>
                    </div>

                    <div className="animate-fade-up delay-400">
                        <StatChips heroStats={heroStats} />
                    </div>
                </div>

                <div className="relative hidden animate-scale-in delay-200 lg:col-span-5 lg:block">
                    <div className="pointer-events-none absolute inset-0 -m-10 rounded-[2rem] bg-brand/25 blur-3xl animate-glow-pulse" />
                    <div className="relative overflow-hidden rounded-[1.75rem] border border-border shadow-elevated">
                        <img
                            src={heroHome}
                            alt="GCFitness interior"
                            width={1200}
                            height={1504}
                            className="aspect-[4/5] w-full object-cover"
                        />

                        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 backdrop-blur">
                            <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-white">
                                Live · 42% Capacity
                            </span>
                        </div>

                        <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-xs font-semibold text-white">Next Sessions</span>
                                <span className="text-[10px] font-medium uppercase tracking-widest text-brand">
                                    Today
                                </span>
                            </div>
                            <div className="space-y-2">
                                <ScheduleRow color="bg-brand" name="Hypertrophy I" time="16:30 — 17:30" />
                                <ScheduleRow color="bg-white/40" name="Neural Performance" time="18:00 — 19:00" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ScheduleRow({ color, name, time }) {
    return (
        <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2.5">
                <span className={`size-2 rounded-full ${color}`} />
                <span className="text-xs font-medium text-white">{name}</span>
            </div>
            <span className="text-[10px] text-white/60">{time}</span>
        </div>
    );
}

function StatChips({ heroStats }) {
    return (
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {heroStats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-card/50 p-4 backdrop-blur">
                    <div className="font-display text-3xl font-semibold">
                        {s.value}
                        <span className="text-brand">{s.suffix}</span>
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                </div>
            ))}
        </div>
    );
}

/* -------------------------- TRUSTED BY -------------------------- */
function TrustedBy({ partners }) {
    return (
        <section className="relative overflow-hidden border-y border-border py-16">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[100px]" />

            <div className="relative mx-auto max-w-7xl px-6">
                <Reveal className="mb-10 flex justify-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5">
                        <span className="size-1.5 rounded-full bg-brand animate-pulse" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                            Trusted equipment &amp; partners
                        </span>
                    </div>
                </Reveal>
            </div>

            <div className="relative">
                <MarqueeRow partners={partners} />
            </div>
        </section>
    );
}

function MarqueeRow({ partners }) {
    const track = [...partners, ...partners];
    return (
        <div className="marquee-fade overflow-hidden">
            <div className="flex w-max animate-marquee items-center gap-14 hover:[animation-play-state:paused]">
                {track.map((partner, i) => (
                    <img
                        key={`${partner.name}-${i}`}
                        src={partner.logo_path}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className="h-24 w-auto shrink-0 object-contain opacity-90 grayscale drop-shadow-sm transition duration-300 hover:scale-110 hover:opacity-100 hover:grayscale-0 md:h-32"
                    />
                ))}
            </div>
        </div>
    );
}

/* -------------------------- WHY US -------------------------- */
function WhyUs() {
    const features = [
        { icon: Clock, title: "24/7 Precision Access", desc: "Biometric entry. Train when your schedule demands it — day or night." },
        { icon: ShieldCheck, title: "Certified Oversight", desc: "Every coach holds Level 3+ credentials with specialized mastery." },
        { icon: Dumbbell, title: "Elite Equipment", desc: "Technogym & Rogue platforms calibrated for maximal response." },
        { icon: Salad, title: "Nutrition Programs", desc: "Registered dietitians build meal plans around your training." },
        { icon: Smartphone, title: "Companion App", desc: "Book classes, log sessions, and track biometrics from your phone." },
        { icon: Sparkles, title: "Recovery Zone", desc: "Cryotherapy, infrared sauna, and mobility bays for full restoration." },
    ];
    return (
        <section id="why-us" className="scroll-mt-16 py-16">
            <div className="mx-auto max-w-7xl px-6">
                <Reveal>
                    <SectionHeader
                        eyebrow="Why GCFitness"
                        title="Engineered for results."
                        desc="We remove guesswork from your fitness journey through data-led programming and professional oversight."
                    />
                </Reveal>
                <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
                    {features.map(({ icon: Icon, title, desc }, i) => (
                        <Reveal key={title} delay={i * 80}>
                            <div className="group relative h-full bg-background p-8 transition hover:bg-card">
                                <div className="mb-5 grid size-11 place-items-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/20 transition group-hover:bg-brand group-hover:text-white">
                                    <Icon className="size-5" />
                                </div>
                                <h3 className="font-display text-xl font-semibold">{title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                                <div className="absolute inset-x-8 bottom-0 h-px scale-x-0 bg-brand transition-transform duration-500 group-hover:scale-x-100" />
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* -------------------------- HOW IT WORKS -------------------------- */
function HowItWorks() {
    const steps = [
        {
            n: "01", icon: ClipboardCheck, img: aboutMission,
            title: "Start with a consultation",
            desc: "We learn about your goals, lifestyle, and fitness level to build the right strategy for you.",
            tone: "strong", cta: { href: "/contact", label: "Book a consult" },
        },
        {
            n: "02", icon: Dumbbell, img: "/images/trainers/trainer-2.jpg",
            title: "Get your custom training plan",
            desc: "Your coach builds a personalized routine designed around your body, pace, and long-term goals.",
            tone: "muted",
        },
        {
            n: "03", icon: TrendingUp, img: stepTrackImg,
            title: "Track progress & improve weekly",
            desc: "We monitor your results and support every step so you stay consistent and see real change.",
            tone: "neutral",
        },
    ];

    return (
        <section className="border-t border-border py-24">
            <div className="mx-auto max-w-7xl px-6">
                <Reveal>
                    <div className="mb-14 max-w-2xl">
                        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                            How it works
                        </div>
                        <h2 className="font-display text-4xl uppercase md:text-5xl">
                            Simple steps to start your{" "}
                            <span className="text-muted-foreground">fitness journey</span> with{" "}
                            <span className="text-muted-foreground">confidence.</span>
                        </h2>
                    </div>
                </Reveal>

                <div className="relative flex flex-col gap-6">
                    <div className="pointer-events-none absolute left-7 top-7 bottom-7 w-px bg-border" />
                    {steps.map((s, i) => (
                        <Reveal key={s.n} delay={i * 120}>
                            <StepRow {...s} />
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

const STEP_TONE_CLASSES = {
    strong: "bg-brand text-white",
    muted: "border border-brand/25 bg-brand/10 text-foreground",
    neutral: "border border-border bg-card text-foreground",
};

const STEP_NUMBER_CLASSES = {
    strong: "text-white/30",
    muted: "text-brand/40",
    neutral: "text-muted-foreground/30",
};

function StepRow({ n, icon: Icon, img, title, desc, tone, cta }) {
    return (
        <div className="relative flex gap-6">
            <div className="relative z-10 grid size-14 shrink-0 place-items-center self-start rounded-full border-4 border-background bg-card text-brand shadow-elevated">
                <Icon className="size-5" />
            </div>
            <div className="grid flex-1 overflow-hidden rounded-2xl sm:grid-cols-[200px_1fr]">
                <img src={img} alt="" aria-hidden loading="lazy" className="hidden h-full w-full object-cover sm:block" />
                <div className={`relative flex flex-col justify-center overflow-hidden p-6 md:p-10 ${STEP_TONE_CLASSES[tone]}`}>
                    <div className={`font-hero text-5xl md:text-6xl ${STEP_NUMBER_CLASSES[tone]}`}>{n}</div>
                    <h3 className="mt-3 font-display text-xl uppercase md:text-2xl">{title}</h3>
                    <p className={`mt-2 max-w-md text-sm ${tone === "strong" ? "text-white/80" : "text-muted-foreground"}`}>
                        {desc}
                    </p>
                    {cta && (
                        <Link
                            href={cta.href}
                            className={`mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-full px-6 text-xs font-bold uppercase tracking-widest transition ${
                                tone === "strong" ? "bg-white text-brand hover:bg-white/90" : "bg-brand text-white hover:bg-brand-hover"
                            }`}
                        >
                            {cta.label}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

/* -------------------------- PROGRAMS -------------------------- */
function Programs({ programs }) {
    return (
        <section className="border-t border-border bg-surface py-24">
            <div className="mx-auto max-w-7xl px-6">
                <Reveal>
                    <SectionHeader
                        eyebrow="Programs"
                        title="Specialized domains."
                        desc="Select your path to peak performance."
                        cta={{ href: "/programs", label: "View all programs" }}
                    />
                </Reveal>
                <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {programs.map((p, i) => (
                        <Reveal key={p.title} delay={i * 60}>
                            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img
                                        src={p.image_path}
                                        alt={p.title}
                                        loading="lazy"
                                        className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                </div>
                                <div className="flex flex-1 flex-col p-6">
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        <Tag color="brand">{p.tag}</Tag>
                                        <Tag>{p.duration}</Tag>
                                        <Tag>{p.level}</Tag>
                                    </div>
                                    <h3 className="font-display text-2xl font-semibold text-foreground">{p.title}</h3>
                                    <p className="mt-1.5 text-sm text-muted-foreground">{p.home_description}</p>
                                    <div className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
                                        Explore program
                                        <span className="grid size-6 place-items-center rounded-full bg-foreground/10 transition group-hover:bg-brand group-hover:text-white">
                                            <ArrowRight className="size-3" />
                                        </span>
                                    </div>
                                </div>
                            </article>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Tag({ children, color }) {
    const cls =
        color === "brand"
            ? "bg-brand/20 text-brand ring-1 ring-brand/30"
            : "bg-foreground/5 text-muted-foreground ring-1 ring-foreground/10";
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${cls}`}>
            {children}
        </span>
    );
}

/* -------------------------- TRAINERS -------------------------- */
function Trainers({ trainers }) {
    return (
        <section className="py-24">
            <div className="mx-auto max-w-7xl px-6">
                <Reveal>
                    <SectionHeader
                        eyebrow="The team"
                        title="Coached by the best."
                        desc="Former pros, sports scientists, and world-class movement specialists."
                        cta={{ href: "/about", label: "Meet the team" }}
                    />
                </Reveal>
                <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {trainers.map((t, i) => (
                        <Reveal key={t.name} delay={i * 80}>
                            <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                                <div className="relative aspect-[3/4] overflow-hidden">
                                    <img
                                        src={t.image_path}
                                        alt={t.name}
                                        loading="lazy"
                                        className="size-full object-cover grayscale transition duration-700 group-hover:grayscale-0 group-hover:scale-[1.03]"
                                    />
                                </div>
                                <div className="p-5">
                                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-brand">
                                        {t.years_experience} yrs experience
                                    </div>
                                    <h3 className="font-display text-xl font-semibold text-foreground">{t.name}</h3>
                                    <p className="text-sm text-muted-foreground">{t.specialty}</p>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* -------------------------- STATS -------------------------- */
function Stats({ impactStats }) {
    return (
        <section className="relative border-y border-border bg-surface py-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-grid opacity-30" />
            <div className="relative mx-auto grid max-w-7xl items-start gap-12 px-6 lg:grid-cols-2">
                <div className="flex h-full flex-col self-stretch">
                    <Reveal>
                        <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                            Our impact
                        </div>
                        <h2 className="font-display text-4xl uppercase md:text-5xl">
                            Results that speak for themselves.
                        </h2>
                    </Reveal>
                    <div className="mt-10 flex flex-1 items-center md:mt-0">
                        <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2">
                            {impactStats.map((s, i) => (
                                <Reveal key={s.label} delay={i * 80} className="text-center">
                                    <Counter end={parseInt(s.value, 10)} suffix={s.suffix} />
                                    <div className="mt-2 text-sm uppercase tracking-widest text-muted-foreground">
                                        {s.label}
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
                <Reveal>
                    <CutoutImage src={statsImg} alt="GCFitness member training" />
                </Reveal>
            </div>
        </section>
    );
}

function Counter({ end, suffix }) {
    const [n, setN] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        if (!ref.current) return;
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting && !started.current) {
                        started.current = true;
                        const dur = 1600;
                        const start = performance.now();
                        const tick = (now) => {
                            const p = Math.min((now - start) / dur, 1);
                            setN(Math.floor(end * (1 - Math.pow(1 - p, 3))));
                            if (p < 1) requestAnimationFrame(tick);
                        };
                        requestAnimationFrame(tick);
                    }
                });
            },
            { threshold: 0.4 },
        );
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, [end]);

    return (
        <div ref={ref} className="font-display text-7xl font-semibold sm:text-7xl md:text-8xl">
            {n.toLocaleString()}
            <span className="text-brand">{suffix}</span>
        </div>
    );
}

/* -------------------------- MEMBERSHIP -------------------------- */
function Membership({ membershipPlans }) {
    const [annual, setAnnual] = useState(false);

    return (
        <section id="membership" className="py-24">
            <div className="mx-auto max-w-7xl px-6">
                <Reveal className="text-center">
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                        Membership
                    </div>
                    <h2 className="font-display text-4xl uppercase md:text-5xl">Choose your access.</h2>
                    <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                        Transparent tiers. No hidden fees. Cancel anytime.
                    </p>

                    <div className="mt-8 inline-flex items-center rounded-full border border-border bg-card p-1">
                        <button
                            onClick={() => setAnnual(false)}
                            className={`rounded-full px-5 py-2 text-xs font-semibold transition ${!annual ? "bg-brand text-white shadow-brand" : "text-muted-foreground"}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setAnnual(true)}
                            className={`rounded-full px-5 py-2 text-xs font-semibold transition ${annual ? "bg-brand text-white shadow-brand" : "text-muted-foreground"}`}
                        >
                            Annual · Save 15%
                        </button>
                    </div>
                </Reveal>

                <div className="mt-14 grid gap-6 md:grid-cols-3">
                    {membershipPlans.map((p, i) => (
                        <Reveal key={p.name} delay={i * 100}>
                            <div
                                className={`relative flex h-full flex-col rounded-2xl border p-8 ${
                                    p.popular ? "border-brand/60 bg-card shadow-brand" : "border-border bg-card/60"
                                }`}
                            >
                                {p.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                        Most Popular
                                    </div>
                                )}
                                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="font-display text-5xl font-semibold">
                                        ${annual ? p.annual_price : p.monthly_price}
                                    </span>
                                    <span className="text-muted-foreground">/mo</span>
                                </div>
                                <ul className="mt-6 flex-grow space-y-3">
                                    {p.home_features.map((f) => (
                                        <li key={f} className="flex items-center gap-3 text-sm">
                                            <span className="grid size-5 place-items-center rounded-full bg-brand/15 text-brand">
                                                <Check className="size-3" strokeWidth={3} />
                                            </span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <a
                                    href={GYM_MASTER_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`mt-8 flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold transition ${
                                        p.popular ? "bg-brand text-white hover:bg-brand-hover" : "border border-border bg-white/[0.03] hover:bg-white/[0.06]"
                                    }`}
                                >
                                    Get {p.name}
                                </a>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* -------------------------- TESTIMONIALS -------------------------- */
function Testimonials({ testimonials }) {
    return (
        <section className="border-t border-border bg-surface py-24">
            <div className="mx-auto max-w-7xl px-6">
                <Reveal>
                    <SectionHeader
                        eyebrow="Members"
                        title="Real transformations."
                        desc="What our community says about training at GCFitness."
                    />
                </Reveal>
                <div className="mt-14 grid gap-6 md:grid-cols-3">
                    {testimonials.map((t, i) => (
                        <Reveal key={t.name} delay={i * 100}>
                            <figure className="relative h-full overflow-hidden rounded-2xl border border-border bg-card p-8">
                                <Quote className="absolute right-6 top-6 size-10 text-brand/25" />
                                <div className="mb-4 flex gap-0.5 text-brand">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className="size-3.5 fill-current" />
                                    ))}
                                </div>
                                <blockquote className="text-sm leading-relaxed text-foreground">
                                    “{t.quote}”
                                </blockquote>
                                <figcaption className="mt-6 border-t border-border pt-4">
                                    <div className="text-sm font-semibold">{t.name}</div>
                                    <div className="text-xs text-muted-foreground">{t.role}</div>
                                </figcaption>
                            </figure>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* -------------------------- FINAL CTA -------------------------- */
function FinalCTA() {
    return (
        <section className="relative overflow-hidden py-32">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-[140px]" />
            <Reveal className="relative mx-auto max-w-4xl px-6 text-center">
                <Flame className="mx-auto size-10 text-brand" />
                <h2 className="mt-6 font-display text-5xl font-semibold tracking-tight md:text-7xl">
                    Ready to transform <br />
                    <span className="text-gradient-brand">your life?</span>
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
                    Two-week trial. No commitment. Come see what a real performance club feels like.
                </p>
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                    <Link
                        href="/membership"
                        className="group inline-flex h-14 items-center gap-2 rounded-full bg-brand px-8 text-sm font-semibold text-white shadow-brand transition hover:bg-brand-hover"
                    >
                        Start Free Trial
                        <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </Link>
                    <Link
                        href="/contact"
                        className="inline-flex h-14 items-center gap-2 rounded-full border border-border bg-white/[0.03] px-8 text-sm font-semibold backdrop-blur transition hover:bg-white/[0.06]"
                    >
                        <Users className="size-4" />
                        Book a tour
                    </Link>
                </div>
            </Reveal>
        </section>
    );
}

/* -------------------------- SECTION HEADER -------------------------- */
function SectionHeader({ eyebrow, title, desc, cta }) {
    return (
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">{eyebrow}</div>
                <h2 className="font-display text-4xl uppercase md:text-5xl">{title}</h2>
                <p className="mt-4 text-muted-foreground">{desc}</p>
            </div>
            {cta && (
                <Link href={cta.href} className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                    {cta.label}
                    <span className="grid size-8 place-items-center rounded-full border border-border transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
                        <ArrowRight className="size-3.5" />
                    </span>
                </Link>
            )}
        </div>
    );
}
```

- [ ] **Step 4: Verify in the browser**

Run `npm run dev` and `php artisan serve`, visit `/`, and compare side-by-side against the source app (`cd "C:\Users\Project Office 6\Desktop\GC-Fitness-Rebrand" && npm run dev`, default port 3000) rendering the same route. Confirm: hero stat chips show 12+/12k/24/8; the partner marquee scrolls with 13 logos; the programs grid shows exactly the 6 featured programs with their short descriptions; the trainers grid shows all 4 trainers; the impact stats count up to 12,000+ / 50+ / 200 / 98%; the membership cards show 4/5/5-item feature lists at $85/$140/$290 (toggle to annual and confirm $72/$119/$247); the 3 home testimonials render (Daniel R., Priya S. "Powerlifter", Marco B.).

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/HomeController.php resources/js/Pages/Home.jsx routes/web.php
git commit -m "feat: port GCFitness Home page"
```

---

## Task 17: About page

Ports `GC-Fitness-Rebrand/src/routes/about.tsx` (mission, impact stats, values, company timeline, member testimonials, full trainer profiles). Trainers/stats/testimonials come from the same models Task 16 used; the timeline, values, and "trainer standards" blocks are static content with no CMS equivalent in the source app, so they stay hardcoded.

**Files:**
- Create: `app/Http/Controllers/AboutController.php`
- Create: `resources/js/Pages/About.jsx`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `Trainer`, `Stat`, `Testimonial` models; `PageHero`, `CutoutImage`, `Reveal` (Task 5); `resources/js/assets/{hero-about.jpg, gym-man1-removebg-preview.png}` (Task 3).
- Produces: the `/about` route.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/AboutController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Stat;
use App\Models\Testimonial;
use App\Models\Trainer;

class AboutController extends Controller
{
    public function index()
    {
        return inertia('About', [
            'trainers' => Trainer::orderBy('sort_order')->get(['name', 'specialty', 'years_experience', 'bio', 'certifications', 'image_path']),
            'stats' => Stat::where('page', 'about')->where('section', 'impact')->orderBy('sort_order')->get(['label', 'value']),
            'testimonials' => Testimonial::where('page', 'about')->orderBy('sort_order')->get(['quote', 'name', 'role']),
        ]);
    }
}
```

- [ ] **Step 2: Add the route**

In `routes/web.php`, add:

```php
use App\Http\Controllers\AboutController;

Route::get('/about', [AboutController::class, 'index']);
```

- [ ] **Step 3: Create the page component**

Ports `GC-Fitness-Rebrand/src/routes/about.tsx`. Changes: `createFileRoute`'s `head()` → an Inertia `<Head>` block; `<Link to>` → `<Link href>`; the `trainers` array replaced by the `trainers` prop; the `stats` array replaced by the `stats` prop; the `testimonials` array replaced by the `testimonials` prop; `timeline`, `values`, and `trainerStandards` stay hardcoded (no backing model, per this task's scope note above). Create `resources/js/Pages/About.jsx`:

```jsx
import { Head, Link } from "@inertiajs/react";
import { ArrowRight, Quote, Instagram, Award, Trophy, GraduationCap } from "lucide-react";

import heroImg from "@/assets/hero-about.jpg";
import missionImg from "@/assets/gym-man1-removebg-preview.png";
import { CutoutImage } from "@/Components/CutoutImage";
import { PageHero } from "@/Components/PageHero";
import { Reveal } from "@/Components/Reveal";

const timeline = [
    { year: "2013", title: "Founded", desc: "Two coaches, one warehouse, a barbell." },
    { year: "2016", title: "First flagship", desc: "Opened our Mercer Street club — 20,000 sq ft of purpose-built training." },
    { year: "2019", title: "Recovery lab", desc: "Added cryo, infrared, and mobility programming." },
    { year: "2023", title: "10,000 members", desc: "The community that redefined boutique fitness in NYC." },
    { year: "2026", title: "Today", desc: "Three clubs. Fifty coaches. One standard." },
];

const values = [
    { title: "Precision", desc: "Every set has a purpose. Every metric has meaning." },
    { title: "Craft", desc: "Programming is a craft, not a plan. We treat it that way." },
    { title: "Community", desc: "You train harder when the room around you trains harder." },
    { title: "Discretion", desc: "This is a members' club. Your training is your business." },
];

const trainerStandards = [
    { icon: GraduationCap, title: "Level 3+ credentials", desc: "Every coach holds internationally recognized certifications and continues education quarterly." },
    { icon: Trophy, title: "Elite athletic background", desc: "Former Olympians, national athletes, and IFBB competitors. They've trained at the top." },
    { icon: Award, title: "Peer-reviewed programming", desc: "Every training block is audited by our Head of Performance before it reaches members." },
];

export default function About({ trainers, stats, testimonials }) {
    return (
        <>
            <Head title="About — GCFitness">
                <meta name="description" content="The story behind GCFitness. Our mission, values, and the team building the next standard in performance training." />
            </Head>

            <PageHero
                image={heroImg}
                eyebrow="About Us"
                titleOutline="About"
                titleSolid="GCFitness"
                subtitle="We built the club we wanted to train in. Elite coaches, purpose-built equipment, and a community that shows up — every single day."
            />

            {/* Mission */}
            <section className="border-t border-border py-24">
                <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
                    <Reveal>
                        <div>
                            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                                Our mission
                            </div>
                            <h2 className="font-display text-4xl uppercase md:text-5xl">
                                Raise the standard of what a gym can be.
                            </h2>
                            <p className="mt-6 text-muted-foreground">
                                We believe every serious athlete — professional or otherwise — deserves a club that treats training as a discipline. That means professional coaches, real programming, uncompromising equipment, and a room that trains alongside you.
                            </p>
                            <p className="mt-4 text-muted-foreground">
                                We are not a fitness chain. We are a members-only performance club with three locations, fifty coaches, and one uncompromising standard.
                            </p>
                        </div>
                    </Reveal>
                    <Reveal delay={150}>
                        <CutoutImage src={missionImg} alt="GCFitness coach" />
                    </Reveal>
                </div>
            </section>

            {/* Stats */}
            <section className="border-t border-border bg-surface py-20">
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
                    {stats.map((s, i) => (
                        <Reveal key={s.label} delay={i * 80} className="text-center">
                            <div className="font-hero text-6xl text-brand md:text-7xl">{s.value}</div>
                            <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* Values */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <Reveal>
                        <h2 className="mb-14 font-display text-4xl uppercase md:text-5xl">What we stand on.</h2>
                    </Reveal>
                    <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
                        {values.map((v, i) => (
                            <Reveal key={v.title} delay={i * 80} className="bg-background p-8">
                                <div className="font-hero text-5xl text-brand">0{i + 1}</div>
                                <h3 className="mt-4 font-display text-xl uppercase">{v.title}</h3>
                                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="border-t border-border bg-surface py-24">
                <div className="mx-auto max-w-5xl px-6">
                    <Reveal>
                        <h2 className="mb-14 font-display text-4xl uppercase md:text-5xl">The journey.</h2>
                    </Reveal>
                    <div className="space-y-4">
                        {timeline.map((t, i) => (
                            <Reveal key={t.year} delay={i * 80}>
                                <div className="grid grid-cols-[minmax(0,140px)_1fr] items-baseline gap-6 border-b border-border pb-6">
                                    <div className="font-hero text-5xl text-brand md:text-6xl">{t.year}</div>
                                    <div>
                                        <h3 className="font-display text-2xl uppercase">{t.title}</h3>
                                        <p className="mt-1 text-muted-foreground">{t.desc}</p>
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <Reveal>
                        <h2 className="mb-14 font-display text-4xl uppercase md:text-5xl">Members, in their words.</h2>
                    </Reveal>
                    <div className="grid gap-6 md:grid-cols-3">
                        {testimonials.map((t, i) => (
                            <Reveal key={t.name} delay={i * 100}>
                                <blockquote className="flex h-full flex-col rounded-2xl border border-border bg-card p-8">
                                    <Quote className="size-8 text-brand" />
                                    <p className="mt-4 flex-grow text-foreground/85">"{t.quote}"</p>
                                    <footer className="mt-6 border-t border-border pt-4">
                                        <div className="font-display uppercase">{t.name}</div>
                                        <div className="text-xs text-muted-foreground">{t.role}</div>
                                    </footer>
                                </blockquote>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Coaches */}
            <section id="trainers" className="border-t border-border bg-surface py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <Reveal>
                        <div className="mb-14 max-w-2xl">
                            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                                The team
                            </div>
                            <h2 className="font-display text-4xl uppercase md:text-5xl">Coached by the best.</h2>
                            <p className="mt-4 text-muted-foreground">
                                Every GCFitness coach holds Level 3+ credentials and specialized mastery in their domain. This isn't personal training — it's professional oversight.
                            </p>
                        </div>
                    </Reveal>

                    <div className="mb-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
                        {trainerStandards.map(({ icon: Icon, title, desc }, i) => (
                            <Reveal key={title} delay={i * 100} className="bg-background p-8">
                                <Icon className="size-8 text-brand" />
                                <div className="mt-6 font-display text-xl uppercase">{title}</div>
                                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                            </Reveal>
                        ))}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {trainers.map((t, i) => (
                            <Reveal key={t.name} delay={i * 80}>
                                <article className="group grid h-full gap-6 rounded-2xl border border-border bg-card p-6 md:grid-cols-[220px_1fr]">
                                    <div className="relative overflow-hidden rounded-xl">
                                        <img
                                            src={t.image_path}
                                            alt={t.name}
                                            loading="lazy"
                                            className="aspect-[3/4] size-full object-cover grayscale transition duration-700 group-hover:grayscale-0"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-semibold uppercase tracking-widest text-brand">
                                            {t.years_experience} years experience
                                        </div>
                                        <h3 className="mt-2 font-display text-2xl uppercase">{t.name}</h3>
                                        <p className="text-sm text-muted-foreground">{t.specialty}</p>
                                        <p className="mt-4 text-sm leading-relaxed text-foreground/85">{t.bio}</p>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {t.certifications.map((c) => (
                                                <span
                                                    key={c}
                                                    className="rounded-full border border-border bg-foreground/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                                                >
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                        <a
                                            href="#"
                                            className="mt-auto inline-flex w-fit items-center gap-2 pt-6 text-xs font-bold uppercase tracking-widest hover:text-brand"
                                        >
                                            <Instagram className="size-4" /> Follow
                                        </a>
                                    </div>
                                </article>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-border bg-surface py-24">
                <div className="mx-auto max-w-4xl px-6 text-center">
                    <Reveal>
                        <h2 className="font-display text-4xl uppercase md:text-5xl">Train with intent.</h2>
                        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                            Book a tour of your nearest GCFitness club.
                        </p>
                        <Link
                            href="/contact"
                            className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-brand px-8 text-sm font-bold uppercase tracking-widest text-white shadow-brand hover:bg-brand-hover"
                        >
                            Book a tour <ArrowRight className="size-4" />
                        </Link>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
```

- [ ] **Step 4: Verify in the browser**

Visit `/about` and compare against the source app's `/about`. Confirm: the mission section and cutout image render; the 4 stats read 12,000+ / 50+ / 3 / 98%; the values grid (Precision/Craft/Community/Discretion), timeline (2013→2026), and 3 About testimonials (Elena K., James O., Priya S. "Member since 2018") all render; all 4 trainer profiles show photo, years, specialty, bio, and certification badges.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/AboutController.php resources/js/Pages/About.jsx routes/web.php
git commit -m "feat: port GCFitness About page"
```

---

## Task 18: Programs page

Ports `GC-Fitness-Rebrand/src/routes/programs.tsx` — the full 8-program catalog (using each program's full `description`, unlike Home's `home_description` preview), plus the static "four pillars" method section and sample weekly schedule (neither has a backing model in the source app).

**Files:**
- Create: `app/Http/Controllers/ProgramsController.php`
- Create: `resources/js/Pages/Programs.jsx`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `Program` model (Task 7); `PageHero`, `Reveal` (Task 5); `resources/js/assets/hero-programs.jpg` (Task 3).
- Produces: the `/programs` route.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/ProgramsController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Program;

class ProgramsController extends Controller
{
    public function index()
    {
        return inertia('Programs', [
            'programs' => Program::orderBy('sort_order')->get(['title', 'tag', 'duration', 'level', 'description', 'image_path']),
        ]);
    }
}
```

- [ ] **Step 2: Add the route**

In `routes/web.php`, add:

```php
use App\Http\Controllers\ProgramsController;

Route::get('/programs', [ProgramsController::class, 'index']);
```

- [ ] **Step 3: Create the page component**

Ports `GC-Fitness-Rebrand/src/routes/programs.tsx`. Changes: `head()` → `<Head>`; `<Link to>` → `<Link href>`; the hardcoded `programs` array replaced by the `programs` prop (using `p.description`, the full text, not `home_description`); `pillars` and `week` stay hardcoded (no backing model). Create `resources/js/Pages/Programs.jsx`:

```jsx
import { Head, Link } from "@inertiajs/react";
import { ArrowRight, Clock, Users, Target, Flame } from "lucide-react";

import heroImg from "@/assets/hero-programs.jpg";
import { PageHero } from "@/Components/PageHero";
import { Reveal } from "@/Components/Reveal";

const pillars = [
    { icon: Target, title: "Assessment", desc: "Every journey begins with a full movement screen, biomarker baseline, and goal mapping." },
    { icon: Clock, title: "Periodization", desc: "12-week macrocycles broken into hypertrophy, strength, and peaking blocks." },
    { icon: Users, title: "Small groups", desc: "Never more than 12 athletes per session. Real supervision, real cueing." },
    { icon: Flame, title: "Progression", desc: "Load, tempo, and volume are logged every week. Nothing left to chance." },
];

const week = [
    { day: "MON", focus: "Lower · Strength", coach: "Marcus", time: "06:00 · 12:00 · 18:00" },
    { day: "TUE", focus: "Upper · Hypertrophy", coach: "Jonah", time: "07:00 · 12:30 · 19:00" },
    { day: "WED", focus: "HIIT Surge", coach: "Ana", time: "06:30 · 17:30" },
    { day: "THU", focus: "Boxing Studio", coach: "Ana", time: "12:00 · 18:00 · 20:00" },
    { day: "FRI", focus: "Full Body Power", coach: "Marcus", time: "06:00 · 12:00 · 18:00" },
    { day: "SAT", focus: "Functional Flow", coach: "Lena", time: "08:00 · 10:00" },
    { day: "SUN", focus: "Vinyasa & Yin", coach: "Lena", time: "09:00 · 17:00" },
];

export default function Programs({ programs }) {
    return (
        <>
            <Head title="Programs — GCFitness">
                <meta name="description" content="Specialized training programs at GCFitness: bodybuilding, powerlifting, HIIT, functional, boxing, yoga and more." />
            </Head>

            <PageHero
                image={heroImg}
                eyebrow="Programs"
                titleOutline="Our"
                titleSolid="Programs"
                subtitle="From your first session to your one-rep max — our programs are structured, progressive, and coached by people who have lived them."
            >
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/membership"
                        className="group inline-flex h-14 items-center gap-2 rounded-full bg-brand px-8 text-sm font-bold uppercase tracking-widest text-white shadow-brand transition-all duration-300 hover:scale-[1.03] hover:bg-brand-hover hover:shadow-[0_0_40px_-6px_var(--brand-glow)]"
                    >
                        Join to enroll
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                    <Link
                        href="/contact"
                        className="inline-flex h-14 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 text-sm font-bold uppercase tracking-widest text-white backdrop-blur transition-all duration-300 hover:border-white/60 hover:bg-white/20 hover:scale-[1.03]"
                    >
                        Book intro
                    </Link>
                </div>
            </PageHero>

            {/* Pillars */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <Reveal>
                        <div className="mb-14 max-w-2xl">
                            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                                The method
                            </div>
                            <h2 className="font-display text-4xl uppercase md:text-5xl">Four pillars. Zero guesswork.</h2>
                        </div>
                    </Reveal>
                    <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
                        {pillars.map(({ icon: Icon, title, desc }, i) => (
                            <Reveal key={title} delay={i * 80} className="bg-background p-8">
                                <Icon className="size-8 text-brand" />
                                <div className="mt-6 font-display text-xl uppercase">{title}</div>
                                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Programs Grid */}
            <section className="border-t border-border bg-surface py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <Reveal>
                        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
                            <div>
                                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                                    Catalog
                                </div>
                                <h2 className="font-display text-4xl uppercase md:text-5xl">Choose your path.</h2>
                            </div>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Members can enroll in any program at any time. Programs run in rolling 12-week cycles.
                            </p>
                        </div>
                    </Reveal>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {programs.map((p, i) => (
                            <Reveal key={p.title} delay={i * 60}>
                                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={p.image_path}
                                            alt={p.title}
                                            loading="lazy"
                                            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex flex-1 flex-col p-6">
                                        <div className="mb-3 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-brand/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-brand ring-1 ring-brand/30">
                                                {p.tag}
                                            </span>
                                            <span className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ring-1 ring-foreground/10">
                                                {p.duration}
                                            </span>
                                            <span className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ring-1 ring-foreground/10">
                                                {p.level}
                                            </span>
                                        </div>
                                        <h3 className="font-display text-2xl uppercase text-foreground">{p.title}</h3>
                                        <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
                                        <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
                                            Explore
                                            <span className="grid size-6 place-items-center rounded-full bg-foreground/10 transition group-hover:bg-brand group-hover:text-white">
                                                <ArrowRight className="size-3" />
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Weekly Schedule */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <Reveal>
                        <div className="mb-10 max-w-2xl">
                            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                                This week
                            </div>
                            <h2 className="font-display text-4xl uppercase md:text-5xl">Sample training week.</h2>
                            <p className="mt-4 text-muted-foreground">
                                A snapshot of live sessions. Full schedule lives in the member app.
                            </p>
                        </div>
                    </Reveal>
                    <div className="overflow-hidden rounded-2xl border border-border">
                        {week.map((w, i) => (
                            <Reveal key={w.day} delay={i * 40}>
                                <div className="grid grid-cols-[80px_1fr_1fr_auto] items-center gap-4 border-b border-border bg-card p-5 last:border-b-0 md:grid-cols-[100px_1.5fr_1fr_1.5fr]">
                                    <div className="font-display text-2xl uppercase text-brand">{w.day}</div>
                                    <div className="font-display text-lg uppercase">{w.focus}</div>
                                    <div className="hidden text-sm text-muted-foreground md:block">Coach {w.coach}</div>
                                    <div className="text-right text-xs tracking-widest text-muted-foreground md:text-left">
                                        {w.time}
                                    </div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-border bg-surface py-24">
                <div className="mx-auto max-w-4xl px-6">
                    <Reveal>
                        <div className="rounded-3xl border border-border bg-card p-10 text-center md:p-16">
                            <h2 className="font-display text-4xl uppercase md:text-5xl">Not sure where to start?</h2>
                            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                                Book a free intro with one of our head coaches. We'll match you with the right program in under 45 minutes.
                            </p>
                            <Link
                                href="/contact"
                                className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-brand px-8 text-sm font-bold uppercase tracking-widest text-white shadow-brand hover:bg-brand-hover"
                            >
                                Book intro session <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
```

- [ ] **Step 4: Verify in the browser**

Visit `/programs` and compare against the source app's `/programs`. Confirm all 8 programs render in order (Bodybuilding → Women's Strength) with their full (not abbreviated) descriptions, the 4 method pillars render, and the 7-day sample schedule renders.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/ProgramsController.php resources/js/Pages/Programs.jsx routes/web.php
git commit -m "feat: port GCFitness Programs page"
```

---

## Task 19: Membership page

Ports `GC-Fitness-Rebrand/src/routes/membership.tsx` — the 3 plans (using each plan's full `features` list, unlike Home's `home_features` preview), a recovery-zone perks section, a plan comparison table, and membership FAQs. The perks list and compare table are page-only static content with no CMS equivalent in the source app.

**Files:**
- Create: `app/Http/Controllers/MembershipController.php`
- Create: `resources/js/Pages/Membership.jsx`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `MembershipPlan` model (Task 13), `Faq` model (Task 10); `PageHero`, `Reveal`, `FaqItem` (Task 5); `resources/js/assets/{hero-membership.jpg, membership-recovery.jpg}` (Task 3).
- Produces: the `/membership` route.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/MembershipController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Models\MembershipPlan;

class MembershipController extends Controller
{
    public function index()
    {
        return inertia('Membership', [
            'membershipPlans' => MembershipPlan::orderBy('sort_order')->get(['name', 'monthly_price', 'annual_price', 'popular', 'features']),
            'faqs' => Faq::where('page', 'membership')->orderBy('sort_order')->get(['question', 'answer']),
        ]);
    }
}
```

- [ ] **Step 2: Add the route**

In `routes/web.php`, add:

```php
use App\Http\Controllers\MembershipController;

Route::get('/membership', [MembershipController::class, 'index']);
```

- [ ] **Step 3: Create the page component**

Ports `GC-Fitness-Rebrand/src/routes/membership.tsx`. Changes: `head()` → `<Head>`; `<Link to>` → `<Link href>`; the hardcoded `plans` array replaced by the `membershipPlans` prop (using `p.features`, the full list); the hardcoded `faqs` array replaced by the `faqs` prop; `perks` and `compare` stay hardcoded (no backing model). Create `resources/js/Pages/Membership.jsx`:

```jsx
import { Head, Link } from "@inertiajs/react";
import { Check, ArrowRight, Snowflake, Flame, Droplet, HeartPulse } from "lucide-react";
import { useState } from "react";

import heroImg from "@/assets/hero-membership.jpg";
import recoveryImg from "@/assets/membership-recovery.jpg";
import { PageHero } from "@/Components/PageHero";
import { Reveal } from "@/Components/Reveal";
import { FaqItem } from "@/Components/FaqItem";

const GYM_MASTER_URL = "https://gcfitnesscentre.gymmasteronline.com/portal/login";

const perks = [
    { icon: Snowflake, title: "Cryotherapy chamber", desc: "3-minute sessions at −140°C for accelerated recovery and inflammation reduction." },
    { icon: Flame, title: "Infrared sauna", desc: "Detoxification, cardiovascular support, deep muscle relaxation." },
    { icon: Droplet, title: "Cold plunge", desc: "4°C contrast therapy for nervous system regulation and mental clarity." },
    { icon: HeartPulse, title: "InBody scanning", desc: "Monthly body composition and biomarker tracking included." },
];

const compare = [
    ["24/7 Club Access", true, true, true],
    ["Group Classes", "5/mo", "Unlimited", "Unlimited"],
    ["Recovery Zone", false, true, true],
    ["Nutrition Coaching", false, "Consult", "1-on-1"],
    ["Personal Training", false, false, "4/mo"],
    ["Guest Passes", false, "2/mo", "Unlimited"],
    ["Priority Booking", false, false, true],
];

export default function Membership({ membershipPlans, faqs }) {
    const [annual, setAnnual] = useState(false);

    return (
        <>
            <Head title="Membership — GCFitness">
                <meta name="description" content="Choose your GCFitness membership. Essential, Performance, or Elite. Transparent pricing, no hidden fees." />
            </Head>

            <PageHero
                image={heroImg}
                eyebrow="Membership"
                titleOutline="Your"
                titleSolid="Membership"
                subtitle="Three transparent tiers. No initiation fee. Cancel anytime. Two-week free trial available for every new member."
            />

            {/* Toggle + Plans */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <Reveal>
                        <div className="mb-10 flex justify-center">
                            <div className="inline-flex items-center rounded-full border border-border bg-card p-1">
                                <button
                                    onClick={() => setAnnual(false)}
                                    className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition ${!annual ? "bg-brand text-white shadow-brand" : "text-muted-foreground"}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setAnnual(true)}
                                    className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition ${annual ? "bg-brand text-white shadow-brand" : "text-muted-foreground"}`}
                                >
                                    Annual · Save 15%
                                </button>
                            </div>
                        </div>
                    </Reveal>

                    <div className="grid gap-6 md:grid-cols-3">
                        {membershipPlans.map((p, i) => (
                            <Reveal key={p.name} delay={i * 100}>
                                <div
                                    className={`relative flex h-full flex-col rounded-2xl border p-8 transition ${p.popular ? "border-brand/60 bg-card shadow-brand" : "border-border bg-card/60"}`}
                                >
                                    {p.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                                            Most Popular
                                        </div>
                                    )}
                                    <h3 className="font-display text-2xl uppercase">{p.name}</h3>
                                    <div className="mt-4 flex items-baseline gap-1">
                                        <span className="font-hero text-6xl">${annual ? p.annual_price : p.monthly_price}</span>
                                        <span className="text-muted-foreground">/mo</span>
                                    </div>
                                    <ul className="mt-6 flex-grow space-y-3">
                                        {p.features.map((f) => (
                                            <li key={f} className="flex items-center gap-3 text-sm">
                                                <span className="grid size-5 place-items-center rounded-full bg-brand/15 text-brand">
                                                    <Check className="size-3" strokeWidth={3} />
                                                </span>
                                                {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <a
                                        href={GYM_MASTER_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`mt-8 flex h-12 w-full items-center justify-center rounded-full text-xs font-bold uppercase tracking-widest transition ${p.popular ? "bg-brand text-white hover:bg-brand-hover" : "border border-border bg-foreground/[0.03] hover:bg-foreground/[0.06]"}`}
                                    >
                                        Get {p.name}
                                    </a>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recovery zone */}
            <section className="border-t border-border bg-surface py-24">
                <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
                    <Reveal>
                        <div className="relative overflow-hidden rounded-3xl border border-border">
                            <img src={recoveryImg} alt="Recovery zone" loading="lazy" className="aspect-[4/3] size-full object-cover" />
                        </div>
                    </Reveal>
                    <Reveal delay={150}>
                        <div>
                            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                                Recovery Zone
                            </div>
                            <h2 className="font-display text-4xl uppercase md:text-5xl">Train hard. Recover harder.</h2>
                            <p className="mt-4 text-muted-foreground">
                                A calibrated recovery suite included with Performance and Elite. Because what you do between sessions matters as much as the sessions themselves.
                            </p>
                            <div className="mt-8 grid gap-5 sm:grid-cols-2">
                                {perks.map(({ icon: Icon, title, desc }) => (
                                    <div key={title} className="rounded-xl border border-border bg-card p-5">
                                        <Icon className="size-6 text-brand" />
                                        <div className="mt-3 font-display text-base uppercase">{title}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* Compare table */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <Reveal>
                        <h2 className="mb-8 font-display text-4xl uppercase md:text-5xl">Compare plans.</h2>
                    </Reveal>
                    <div className="overflow-hidden rounded-2xl border border-border">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] text-sm">
                                <thead className="bg-card text-left">
                                    <tr>
                                        <th className="p-4 font-semibold">Features</th>
                                        <th className="p-4 font-semibold">Essential</th>
                                        <th className="p-4 font-semibold text-brand">Performance</th>
                                        <th className="p-4 font-semibold">Elite</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card/40">
                                    {compare.map((row) => (
                                        <tr key={row[0]} className="border-t border-border">
                                            {row.map((cell, i) => (
                                                <td key={i} className="p-4">
                                                    {i === 0 ? (
                                                        <span className="font-medium">{cell}</span>
                                                    ) : cell === true ? (
                                                        <Check className="size-4 text-brand" strokeWidth={3} />
                                                    ) : cell === false ? (
                                                        <span className="text-muted-foreground">—</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">{cell}</span>
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="border-t border-border bg-surface py-24">
                <div className="mx-auto max-w-4xl px-6">
                    <Reveal>
                        <h2 className="mb-10 font-display text-4xl uppercase md:text-5xl">Questions, answered.</h2>
                    </Reveal>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <Reveal key={f.question} delay={i * 60}>
                                <FaqItem q={f.question} a={f.answer} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-4xl px-6">
                    <Reveal>
                        <div className="rounded-3xl border border-border bg-card p-10 text-center md:p-16">
                            <h2 className="font-display text-4xl uppercase md:text-5xl">Not ready to commit?</h2>
                            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
                                Two-week free trial. Full club access. No card required.
                            </p>
                            <Link
                                href="/contact"
                                className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-brand px-8 text-sm font-bold uppercase tracking-widest text-white shadow-brand hover:bg-brand-hover"
                            >
                                Start free trial <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </Reveal>
                </div>
            </section>
        </>
    );
}
```

- [ ] **Step 4: Verify in the browser**

Visit `/membership` and compare against the source app's `/membership`. Confirm: 3 plan cards each show their full (5/6/6-item) feature lists at the correct monthly/annual prices; the recovery-zone perks (Cryotherapy/Infrared sauna/Cold plunge/InBody) render; the compare table renders with the right checks/dashes; and the 4 membership FAQs render (not the 3 Contact-page FAQs).

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/MembershipController.php resources/js/Pages/Membership.jsx routes/web.php
git commit -m "feat: port GCFitness Membership page"
```

---

## Task 20: Contact page

Ports `GC-Fitness-Rebrand/src/routes/contact.tsx` — the Formspree-backed contact form (unchanged, per the spec decision to keep it client-side and external), site contact info, the 3-club location grid, and contact FAQs.

**Files:**
- Create: `app/Http/Controllers/ContactController.php`
- Create: `resources/js/Pages/Contact.jsx`
- Modify: `routes/web.php`

**Interfaces:**
- Consumes: `ClubLocation` (Task 11), `Faq` (Task 10), `SiteSetting` (Task 15) models; `PageHero`, `Reveal`, `FaqItem` (Task 5); `resources/js/assets/hero-contact.jpg` (Task 3).
- Produces: the `/contact` route. This is the last page — once verified, the phase 1 public site is complete.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/ContactController.php`:

```php
<?php

namespace App\Http\Controllers;

use App\Models\ClubLocation;
use App\Models\Faq;
use App\Models\SiteSetting;

class ContactController extends Controller
{
    public function index()
    {
        return inertia('Contact', [
            'clubs' => ClubLocation::orderBy('sort_order')->get(['name', 'address', 'hours']),
            'faqs' => Faq::where('page', 'contact')->orderBy('sort_order')->get(['question', 'answer']),
            'siteSetting' => SiteSetting::first(['address_line1', 'address_line2', 'phone', 'email', 'hours']),
        ]);
    }
}
```

- [ ] **Step 2: Add the route**

In `routes/web.php`, add:

```php
use App\Http\Controllers\ContactController;

Route::get('/contact', [ContactController::class, 'index']);
```

- [ ] **Step 3: Create the page component**

Ports `GC-Fitness-Rebrand/src/routes/contact.tsx`. Changes: `head()` → `<Head>`; the hardcoded `clubs` array replaced by the `clubs` prop; the hardcoded `faqs` array replaced by the `faqs` prop; the `InfoCard` block's hardcoded address/phone/email/hours replaced by the `siteSetting` prop. Everything else — the Formspree submission logic, the form fields, the success/countdown UI — is unchanged from the source, since no backend involvement was wanted for the contact form (2026-09-02 decision, see the spec). Create `resources/js/Pages/Contact.jsx`:

```jsx
import { Head } from "@inertiajs/react";
import { MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import heroImg from "@/assets/hero-contact.jpg";
import { PageHero } from "@/Components/PageHero";
import { Reveal } from "@/Components/Reveal";
import { FaqItem } from "@/Components/FaqItem";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xaqrkzag";

export default function Contact({ clubs, faqs, siteSetting }) {
    const [sent, setSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(false);
    const [countdown, setCountdown] = useState(8);

    async function handleSubmit(e) {
        e.preventDefault();
        setSending(true);
        setError(false);
        try {
            const res = await fetch(FORMSPREE_ENDPOINT, {
                method: "POST",
                body: new FormData(e.currentTarget),
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error("Submission failed");
            setSent(true);
        } catch {
            setError(true);
        } finally {
            setSending(false);
        }
    }

    useEffect(() => {
        if (!sent) return;
        if (countdown <= 0) {
            window.location.reload();
            return;
        }
        const t = window.setTimeout(() => setCountdown((n) => n - 1), 1000);
        return () => window.clearTimeout(t);
    }, [sent, countdown]);

    return (
        <>
            <Head title="Contact — GCFitness">
                <meta name="description" content="Book a tour, start a free trial, or reach the GCFitness team. We respond within one business day." />
            </Head>

            <PageHero
                image={heroImg}
                eyebrow="Contact"
                titleOutline="Get In"
                titleSolid="Touch"
                subtitle="Send us a message and we'll be in touch within one business day. Or walk in — our reception is open 7 days."
            />

            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
                        {/* Form */}
                        <Reveal>
                            <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-8 md:p-10">
                                {sent ? (
                                    <div className="py-16 text-center animate-scale-in">
                                        <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand/15 text-brand">
                                            <ArrowRight className="size-6" />
                                        </div>
                                        <h3 className="mt-4 font-display text-3xl uppercase">Message sent</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            We'll get back to you within one business day.
                                        </p>
                                        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                                            This page will refresh in {countdown}…
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => window.location.reload()}
                                            className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-border px-6 text-xs font-bold uppercase tracking-widest hover:bg-foreground/5"
                                        >
                                            Refresh now
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <input type="hidden" name="_subject" value="New GCFitness contact form message" />
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <Field label="Full name" name="name" required />
                                            <Field label="Email" name="email" type="email" required />
                                        </div>
                                        <Field label="Phone" name="phone" type="tel" />
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                                What can we help with?
                                            </label>
                                            <select
                                                name="service"
                                                className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-brand"
                                            >
                                                <option>Book a free trial</option>
                                                <option>Membership inquiry</option>
                                                <option>Personal training</option>
                                                <option>Corporate</option>
                                                <option>Something else</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                                Message
                                            </label>
                                            <textarea
                                                name="message"
                                                rows={4}
                                                required
                                                className="w-full rounded-lg border border-border bg-background p-4 text-sm outline-none focus:border-brand"
                                                placeholder="Tell us your goals…"
                                            />
                                        </div>
                                        {error && (
                                            <p className="text-sm text-destructive">
                                                Something went wrong sending your message. Please try again, or email us directly.
                                            </p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={sending}
                                            className="inline-flex h-14 items-center gap-2 rounded-full bg-brand px-8 text-xs font-bold uppercase tracking-widest text-white shadow-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {sending ? "Sending…" : "Send message"}
                                            {!sending && <ArrowRight className="size-4" />}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </Reveal>

                        {/* Info */}
                        <Reveal delay={150}>
                            <div className="space-y-4">
                                <InfoCard icon={MapPin} title="Visit us">
                                    {siteSetting.address_line1}<br />{siteSetting.address_line2}
                                </InfoCard>
                                <InfoCard icon={Phone} title="Call">{siteSetting.phone}</InfoCard>
                                <InfoCard icon={Mail} title="Email">{siteSetting.email}</InfoCard>
                                <InfoCard icon={Clock} title="Hours">{siteSetting.hours}</InfoCard>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* Locations */}
            <section className="border-t border-border bg-surface py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <Reveal>
                        <h2 className="mb-14 font-display text-4xl uppercase md:text-5xl">Our clubs.</h2>
                    </Reveal>
                    <div className="grid gap-6 md:grid-cols-3">
                        {clubs.map((c, i) => (
                            <Reveal key={c.name} delay={i * 100}>
                                <div className="h-full rounded-2xl border border-border bg-card p-8">
                                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-brand">
                                        Club
                                    </div>
                                    <div className="font-hero text-4xl uppercase">{c.name}</div>
                                    <p className="mt-4 text-sm text-muted-foreground">{c.address}</p>
                                    <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground/80">
                                        {c.hours}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="border-t border-border py-24">
                <div className="mx-auto max-w-4xl px-6">
                    <Reveal>
                        <h2 className="mb-10 font-display text-4xl uppercase md:text-5xl">Quick answers.</h2>
                    </Reveal>
                    <div className="space-y-3">
                        {faqs.map((f, i) => (
                            <Reveal key={f.question} delay={i * 60}>
                                <FaqItem q={f.question} a={f.answer} />
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

function Field({ label, name, type = "text", required }) {
    return (
        <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {label}
            </label>
            <input
                name={name}
                type={type}
                required={required}
                className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm outline-none focus:border-brand"
            />
        </div>
    );
}

function InfoCard({ icon: Icon, title, children }) {
    return (
        <div className="flex gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
                <Icon className="size-5" />
            </div>
            <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
                <div className="mt-1 text-sm">{children}</div>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Verify in the browser**

Visit `/contact` and compare against the source app's `/contact`. Confirm: the info cards show the address/phone/email/hours from the database; the 3 clubs (Mercer/Brooklyn/Miami) render with their addresses and hours; the 3 contact FAQs render (not the 4 Membership-page FAQs); and submitting the form (with real or test data) shows the "Message sent" success state — this confirms the Formspree integration still works unmodified.

- [ ] **Step 5: Full-site regression pass**

With all 5 pages built, do one final pass: click through Home → Programs → Membership → About → Contact → Home using only the nav bar links (not the address bar), confirming the active-link highlighting in `SiteNav` updates correctly on every page, the preloader only shows once (on the very first load, not on every Inertia navigation), and the route-loading progress bar flashes briefly on each navigation.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/ContactController.php resources/js/Pages/Contact.jsx routes/web.php
git commit -m "feat: port GCFitness Contact page"
```

---

## Plan Self-Review Notes

- **Spec coverage:** every step of the approved spec (`docs/superpowers/specs/2026-09-02-gcfitness-public-site-migration-design.md`) is covered: Step 0 cleanup → Task 1; Step 1 data layer → Tasks 7–15 (expanded from the spec's single step into one task per model, matching the user's process-by-process preference, and corrected to seed from the site's real per-page content rather than the admin-CMS mock data in `seed-data.ts`, per the spec addendum below); Step 2 shared foundation → Tasks 2–6; Step 3 pages → Tasks 16–20.
- **Spec correction discovered during planning:** the approved spec assumed seeding from `GC-Fitness-Rebrand/src/mocks/seed-data.ts`. Reading the actual page source revealed that file is exclusively used by the source app's mocked *admin* API — none of the 5 public pages import from it. Each page instead hardcodes its own content, with real drift between pages showing the "same" content (Program descriptions, membership plan feature counts). Tasks 7–15 seed from the real page content instead, per the user's "exact replication" decision (2026-09-02).
- **Type/naming consistency:** verified `image_path`/`logo_path` naming is consistent between each model, its migration, its seeder, and every controller/page that reads it; `page`/`section` enum values (`home`/`about`, `hero`/`impact`, `contact`/`membership`) are spelled identically everywhere they appear across Tasks 9, 10, 14, 16, 17, 19, 20.
- **No placeholders:** every task's code blocks are complete, runnable files — none are excerpts or "similar to Task N" references.
