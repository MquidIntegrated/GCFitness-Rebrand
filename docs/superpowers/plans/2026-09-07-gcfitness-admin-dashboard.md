# GCFitness Admin Dashboard Implementation Plan (Phase 2, Plan 5 of 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin Dashboard's placeholder page with the real overview screen: a greeting, per-resource content counts, a 14-day edit-activity chart, and a recently-edited feed — the last of the 5 phase-2 admin plans.

**Architecture:** Ports `GC-Fitness-Rebrand/src/components/admin/dashboard/*` (Greeting, OverviewCards, ActivityChart, RecentActivityList) into this project's flat `resources/js/Components/admin/` convention, plus the generic shadcn `ui/chart.tsx` wrapper the chart depends on. Unlike the source app — whose "backend" is an MSW mock returning hand-written fixture data for `recentActivity`/`activityByDay` — this project has a real database, so `DashboardController` computes all three pieces (counts, recent activity, 14-day trend) from the 7 content models' actual `created_at`/`updated_at` timestamps. Inertia-native throughout: `DashboardController::index()` computes everything server-side and passes it as page props on initial render, exactly like every other admin page in this project — there is no client-side fetch, no loading/error state, and therefore no `CardGridSkeleton` port (the source app needed one only because its dashboard fetches over HTTP after mount; this project's Inertia page load already has the data before the page renders).

**Tech Stack:** Laravel 12, Inertia.js v2, React 19, `recharts` (already a dependency, unused until now), `date-fns` (already a dependency), the existing `Card`/`Skeleton` UI primitives and `AdminShell`'s existing Dashboard nav link (all pre-existing, unchanged).

**Spec:** `docs/superpowers/specs/2026-09-03-gcfitness-admin-cms-design.md`

## Global Constraints

- The 7 tracked content resources — matching this project's existing admin CRUD exactly — are: Program, Trainer, MembershipPlan, Partner, ClubLocation, Testimonial, Faq. `SiteSetting` and `SocialLink` are excluded from all three dashboard pieces (counts, recent activity, activity trend), matching the source app's own `COUNT_META`/mock fixture, which never included them either.
- No schema changes: every value the dashboard needs (counts, timestamps) already exists on these 7 models via Eloquent's standard `created_at`/`updated_at` columns. No new `activity_log` table, no new migration.
- "Added" vs "Updated" in the recent-activity feed is derived by comparing a row's `created_at` to its `updated_at` (equal ⇒ "Added", different ⇒ "Updated") — not by a separate audit trail. This is a deliberate, real-data replacement for the source app's hand-written fixture strings ("Updated program: HIIT Blast", etc.), which had no real backend logic to port in the first place.
- Inertia-native throughout: `DashboardController::index()` computes and returns everything as page props on the initial `inertia()` call. No JSON API, no client-side `useEffect` fetch, no loading skeleton.
- Reuse the existing `Card`/`CardHeader`/`CardTitle`/`CardContent` (`resources/js/Components/ui/card.jsx`) and `cn` (`resources/js/lib/utils.js`) — both already present, unchanged by this plan.
- Follow this project's flat component-file convention (`resources/js/Components/admin/<Name>.jsx`, no subfolders) rather than the source app's `components/admin/dashboard/` and `components/admin/shared/` subfolder split.

---

## Task 1: Dashboard backend + page assembly

Ports the source app's dashboard rendering pieces and replaces the mock-fixture data source with real Eloquent queries against this project's 7 content models.

**Files:**
- Create: `resources/js/Components/ui/chart.jsx`
- Create: `resources/js/Components/admin/StatCard.jsx`
- Create: `resources/js/Components/admin/DashboardGreeting.jsx`
- Create: `resources/js/Components/admin/DashboardOverviewCards.jsx`
- Create: `resources/js/Components/admin/DashboardActivityChart.jsx`
- Create: `resources/js/Components/admin/DashboardRecentActivityList.jsx`
- Modify: `resources/js/Pages/Admin/Dashboard.jsx`
- Modify: `app/Http/Controllers/Admin/DashboardController.php`

**Interfaces:**
- Consumes: `Card`/`CardHeader`/`CardTitle`/`CardContent` (`@/Components/ui/card`, pre-existing); `cn` (`@/lib/utils`, pre-existing); `recharts`' `Bar`/`BarChart`/`CartesianGrid`/`XAxis`/`YAxis` (already a project dependency); `date-fns`' `formatDistanceToNow` (already a project dependency); the `auth.user.name` prop already shared globally by `HandleInertiaRequests` (phase 2, plan 1).
- Produces: `DashboardController::index()` returns `Admin/Dashboard` with props `counts` (`{ programs, trainers, membershipPlans, partners, locations, testimonials, faqs }`, all integers), `recentActivity` (array of `{ id: string, description: string, timestamp: string }`, newest first, max 5 entries), `activityByDay` (array of exactly 14 `{ date: "YYYY-MM-DD", count: number }` entries, oldest first, ending today). `resources/js/Components/ui/chart.jsx` exports `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent`, `ChartStyle` — a generic primitive, reusable by any future chart in this project.

- [ ] **Step 1: Port the shadcn chart primitive**

Create `resources/js/Components/ui/chart.jsx` — a straight JS port of the source app's `src/components/ui/chart.tsx` (TypeScript types dropped, `React.forwardRef` kept, behavior unchanged):

```jsx
import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" };

const ChartContext = React.createContext(null);

function useChart() {
    const context = React.useContext(ChartContext);

    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />");
    }

    return context;
}

const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-chart={chartId}
                ref={ref}
                className={cn(
                    "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
                    className,
                )}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }) => {
    const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color);

    if (!colorConfig.length) {
        return null;
    }

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(
                        ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
    .map(([key, itemConfig]) => {
        const color = itemConfig.theme?.[theme] || itemConfig.color;
        return color ? `  --color-${key}: ${color};` : null;
    })
    .join("\n")}
}
`,
                    )
                    .join("\n"),
            }}
        />
    );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef(
    (
        {
            active,
            payload,
            className,
            indicator = "dot",
            hideLabel = false,
            hideIndicator = false,
            label,
            labelFormatter,
            labelClassName,
            formatter,
            color,
            nameKey,
            labelKey,
        },
        ref,
    ) => {
        const { config } = useChart();

        const tooltipLabel = React.useMemo(() => {
            if (hideLabel || !payload?.length) {
                return null;
            }

            const [item] = payload;
            const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const value =
                !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;

            if (labelFormatter) {
                return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>;
            }

            if (!value) {
                return null;
            }

            return <div className={cn("font-medium", labelClassName)}>{value}</div>;
        }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

        if (!active || !payload?.length) {
            return null;
        }

        const nestLabel = payload.length === 1 && indicator !== "dot";

        return (
            <div
                ref={ref}
                className={cn(
                    "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
                    className,
                )}
            >
                {!nestLabel ? tooltipLabel : null}
                <div className="grid gap-1.5">
                    {payload
                        .filter((item) => item.type !== "none")
                        .map((item, index) => {
                            const key = `${nameKey || item.name || item.dataKey || "value"}`;
                            const itemConfig = getPayloadConfigFromPayload(config, item, key);
                            const indicatorColor = color || item.payload.fill || item.color;

                            return (
                                <div
                                    key={item.dataKey}
                                    className={cn(
                                        "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                                        indicator === "dot" && "items-center",
                                    )}
                                >
                                    {formatter && item?.value !== undefined && item.name ? (
                                        formatter(item.value, item.name, item, index, item.payload)
                                    ) : (
                                        <>
                                            {itemConfig?.icon ? (
                                                <itemConfig.icon />
                                            ) : (
                                                !hideIndicator && (
                                                    <div
                                                        className={cn("shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)", {
                                                            "h-2.5 w-2.5": indicator === "dot",
                                                            "w-1": indicator === "line",
                                                            "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                                                            "my-0.5": nestLabel && indicator === "dashed",
                                                        })}
                                                        style={{
                                                            "--color-bg": indicatorColor,
                                                            "--color-border": indicatorColor,
                                                        }}
                                                    />
                                                )
                                            )}
                                            <div
                                                className={cn(
                                                    "flex flex-1 justify-between leading-none",
                                                    nestLabel ? "items-end" : "items-center",
                                                )}
                                            >
                                                <div className="grid gap-1.5">
                                                    {nestLabel ? tooltipLabel : null}
                                                    <span className="text-muted-foreground">{itemConfig?.label || item.name}</span>
                                                </div>
                                                {item.value && (
                                                    <span className="font-mono font-medium tabular-nums text-foreground">
                                                        {item.value.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                </div>
            </div>
        );
    },
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
    const { config } = useChart();

    if (!payload?.length) {
        return null;
    }

    return (
        <div ref={ref} className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}>
            {payload
                .filter((item) => item.type !== "none")
                .map((item) => {
                    const key = `${nameKey || item.dataKey || "value"}`;
                    const itemConfig = getPayloadConfigFromPayload(config, item, key);

                    return (
                        <div key={item.value} className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground">
                            {itemConfig?.icon && !hideIcon ? (
                                <itemConfig.icon />
                            ) : (
                                <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
                            )}
                            {itemConfig?.label}
                        </div>
                    );
                })}
        </div>
    );
});
ChartLegendContent.displayName = "ChartLegend";

function getPayloadConfigFromPayload(config, payload, key) {
    if (typeof payload !== "object" || payload === null) {
        return undefined;
    }

    const payloadPayload =
        "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? payload.payload : undefined;

    let configLabelKey = key;

    if (key in payload && typeof payload[key] === "string") {
        configLabelKey = payload[key];
    } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
        configLabelKey = payloadPayload[key];
    }

    return configLabelKey in config ? config[configLabelKey] : config[key];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
```

- [ ] **Step 2: Create the generic StatCard primitive**

Create `resources/js/Components/admin/StatCard.jsx` (port of `src/components/admin/shared/stat-card.tsx`):

```jsx
import { Card, CardContent } from "@/Components/ui/card";

export function StatCard({ label, value, icon: Icon }) {
    return (
        <Card>
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

- [ ] **Step 3: Create the Greeting component**

Create `resources/js/Components/admin/DashboardGreeting.jsx`. Unlike the source app (which reads the admin's name from `sessionStorage`), this project already shares `auth.user.name` globally via Inertia (`HandleInertiaRequests`, phase 2 plan 1) — read it from `usePage().props` instead:

```jsx
import { usePage } from "@inertiajs/react";

function getGreetingWord(hour) {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

export function DashboardGreeting() {
    const { auth } = usePage().props;
    const name = auth?.user?.name ?? "Admin";
    const greetingWord = getGreetingWord(new Date().getHours());

    return (
        <h1 className="text-2xl font-semibold">
            {greetingWord}, {name}
        </h1>
    );
}
```

- [ ] **Step 4: Create the OverviewCards component**

Create `resources/js/Components/admin/DashboardOverviewCards.jsx` (port of `src/components/admin/dashboard/overview-cards.tsx`):

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
    const countKeys = Object.keys(counts);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {countKeys.map((key) => (
                <StatCard key={key} label={COUNT_META[key].label} value={counts[key]} icon={COUNT_META[key].icon} />
            ))}
        </div>
    );
}
```

- [ ] **Step 5: Create the ActivityChart component**

Create `resources/js/Components/admin/DashboardActivityChart.jsx` (port of `src/components/admin/dashboard/activity-chart.tsx`):

```jsx
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/Components/ui/chart";

const CHART_CONFIG = {
    count: {
        label: "Edits",
        color: "var(--brand)",
    },
};

const MONTH_ABBREVIATIONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDayLabel(isoDate) {
    const [, month, day] = isoDate.split("-").map(Number);
    return `${MONTH_ABBREVIATIONS[month - 1]} ${day}`;
}

export function DashboardActivityChart({ data }) {
    return (
        <div>
            <h2 className="text-sm font-medium text-muted-foreground">Edit activity (last 14 days)</h2>
            <ChartContainer config={CHART_CONFIG} className="mt-2 aspect-auto h-64 w-full">
                <BarChart data={data} margin={{ left: -20 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="date" tickFormatter={formatDayLabel} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} />
                    <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => formatDayLabel(String(value))} />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
            </ChartContainer>
        </div>
    );
}
```

- [ ] **Step 6: Create the RecentActivityList component**

Create `resources/js/Components/admin/DashboardRecentActivityList.jsx` (port of `src/components/admin/dashboard/recent-activity-list.tsx`):

```jsx
import { ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";

export function DashboardRecentActivityList({ activity }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Recently edited</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {activity.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                            <ArrowUpRight className="size-3.5" />
                        </span>
                        <div>
                            <p className="text-sm font-medium">{entry.description}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
```

- [ ] **Step 7: Compute the real dashboard data server-side**

Replace `app/Http/Controllers/Admin/DashboardController.php` in full:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ClubLocation;
use App\Models\Faq;
use App\Models\MembershipPlan;
use App\Models\Partner;
use App\Models\Program;
use App\Models\Testimonial;
use App\Models\Trainer;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class DashboardController extends Controller
{
    /**
     * The 7 content resources tracked by the dashboard's recent-activity
     * feed and 14-day trend — matches COUNT_META below and the source
     * app's own dashboard scope exactly (SiteSetting/SocialLink excluded).
     */
    private const TRACKED_RESOURCES = [
        ['model' => Program::class, 'label' => 'program', 'name_column' => 'title'],
        ['model' => Trainer::class, 'label' => 'trainer', 'name_column' => 'name'],
        ['model' => MembershipPlan::class, 'label' => 'membership plan', 'name_column' => 'name'],
        ['model' => Partner::class, 'label' => 'partner', 'name_column' => 'name'],
        ['model' => ClubLocation::class, 'label' => 'location', 'name_column' => 'name'],
        ['model' => Testimonial::class, 'label' => 'testimonial', 'name_column' => 'name'],
        ['model' => Faq::class, 'label' => 'FAQ', 'name_column' => 'question'],
    ];

    public function index()
    {
        return inertia('Admin/Dashboard', [
            'counts' => [
                'programs' => Program::count(),
                'trainers' => Trainer::count(),
                'membershipPlans' => MembershipPlan::count(),
                'partners' => Partner::count(),
                'locations' => ClubLocation::count(),
                'testimonials' => Testimonial::count(),
                'faqs' => Faq::count(),
            ],
            'recentActivity' => $this->recentActivity(),
            'activityByDay' => $this->activityByDay(),
        ]);
    }

    /**
     * Most-recently-updated rows across all 7 tracked resources, newest
     * first, capped at 5. "Added" vs "Updated" is derived by comparing
     * created_at to updated_at (equal ⇒ never touched since creation)
     * rather than a separate audit log — see Global Constraints.
     */
    private function recentActivity(): array
    {
        $rows = collect();

        foreach (self::TRACKED_RESOURCES as $resource) {
            $rows = $rows->merge(
                $resource['model']::query()
                    ->latest('updated_at')
                    ->take(5)
                    ->get(['id', $resource['name_column'], 'created_at', 'updated_at'])
                    ->map(fn ($row) => [
                        'id' => $resource['label'].'-'.$row->id,
                        'description' => ($row->created_at->equalTo($row->updated_at) ? 'Added ' : 'Updated ')
                            .$resource['label'].': '.Str::limit($row->{$resource['name_column']}, 40),
                        'timestamp' => $row->updated_at,
                    ])
            );
        }

        return $rows->sortByDesc('timestamp')->take(5)->values()->all();
    }

    /**
     * Exactly 14 entries, oldest first, ending today — a real count of how
     * many tracked-resource rows were updated on each day, replacing the
     * source app's hand-written fixture trend.
     */
    private function activityByDay(): array
    {
        $start = Carbon::today()->subDays(13);

        $counts = collect(range(0, 13))
            ->mapWithKeys(fn ($i) => [$start->copy()->addDays($i)->toDateString() => 0]);

        foreach (self::TRACKED_RESOURCES as $resource) {
            $resource['model']::query()
                ->where('updated_at', '>=', $start)
                ->get(['updated_at'])
                ->each(function ($row) use (&$counts) {
                    $date = $row->updated_at->toDateString();
                    if ($counts->has($date)) {
                        $counts[$date] = $counts[$date] + 1;
                    }
                });
        }

        return $counts->map(fn ($count, $date) => ['date' => $date, 'count' => $count])->values()->all();
    }
}
```

- [ ] **Step 8: Assemble the Dashboard page**

Replace `resources/js/Pages/Admin/Dashboard.jsx` in full:

```jsx
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { DashboardGreeting } from "@/Components/admin/DashboardGreeting";
import { DashboardOverviewCards } from "@/Components/admin/DashboardOverviewCards";
import { DashboardActivityChart } from "@/Components/admin/DashboardActivityChart";
import { DashboardRecentActivityList } from "@/Components/admin/DashboardRecentActivityList";

function DashboardPage({ counts, recentActivity, activityByDay }) {
    return (
        <>
            <Head title="Dashboard — GCFitness Admin" />
            <div className="space-y-8">
                <DashboardGreeting />
                <DashboardOverviewCards counts={counts} />
                <DashboardActivityChart data={activityByDay} />
                <DashboardRecentActivityList activity={recentActivity} />
            </div>
        </>
    );
}

DashboardPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default DashboardPage;
```

- [ ] **Step 9: Verify**

Log in via the established curl cookie-jar+XSRF pattern, then:
1. `GET /admin/dashboard` — confirm HTTP 200, `"component":"Admin/Dashboard"`, and that `counts` matches each resource's actual row count (cross-check with `php artisan tinker` — e.g. `Program::count()`, `Trainer::count()`, etc. — against the seeded data).
2. Confirm `recentActivity` has at most 5 entries, each with a non-empty `description` starting with "Added " or "Updated ", and that entries are sorted newest-first by `timestamp`.
3. Confirm `activityByDay` has exactly 14 entries, dates in ascending order, the last date equal to today's date (via `php artisan tinker`'s `now()->toDateString()`).
4. Via `php artisan tinker`, update one seeded row (e.g. `Program::first()->touch()` or an actual field change) and re-fetch `/admin/dashboard` — confirm that row now appears in `recentActivity` with an "Updated " prefix, and that today's `activityByDay` entry incremented by exactly 1.
5. `npm run build` — confirm it succeeds (first real compile check of the ported `ui/chart.jsx` and its `recharts` usage).

- [ ] **Step 10: Commit**

```bash
git add resources/js/Components/ui/chart.jsx resources/js/Components/admin/StatCard.jsx resources/js/Components/admin/DashboardGreeting.jsx resources/js/Components/admin/DashboardOverviewCards.jsx resources/js/Components/admin/DashboardActivityChart.jsx resources/js/Components/admin/DashboardRecentActivityList.jsx resources/js/Pages/Admin/Dashboard.jsx app/Http/Controllers/Admin/DashboardController.php
git commit -m "feat: build real admin Dashboard (counts, activity chart, recent activity)"
```

---

## Task 2: Full manual regression pass

No schema changes happen in this plan, so there's no migration-related transient-connection risk to watch for. This task verifies the dashboard against real data and confirms nothing else regressed — the last verification pass before all 5 phase-2 plans are complete.

**Files:** none (verification only).

**Interfaces:** none — this task consumes everything Task 1 built and produces nothing new.

- [ ] **Step 1: Full regression pass**

Log in via the established curl-based session pattern (or a real browser session if available):

1. **Dashboard data accuracy**: re-verify `counts` against `php artisan tinker`'s live counts for all 7 resources. Create one new row in any tracked resource (e.g. a test Program via `POST /admin/programs`), re-fetch `/admin/dashboard`, confirm the corresponding count incremented by 1 and the new row appears in `recentActivity` as "Added program: ...". Delete the test row afterward.
2. **Nav** (browser-only, flag for human if this session has no browser access): confirm the sidebar's existing "Dashboard" link still highlights correctly when on `/admin/dashboard` (this link and its `isActive` check are pre-existing from Plan 2 and untouched by this plan — confirm no regression).
3. **Chart rendering** (browser-only, flag for human if unavailable): confirm the 14-day bar chart renders with a bar per day and a working hover tooltip, and that the "Recently edited" card lists entries with readable relative timestamps (e.g. "2 hours ago").
4. Confirm no console errors anywhere in the admin area (browser-only, flag for human if unavailable).
5. Confirm every other admin page (Programs, Trainers, Membership Plans, Partners, Locations, Testimonials, FAQs, Site Settings, Social Links) still loads and functions — a final spot-check that nothing in this last plan disturbed earlier phase-2 work.

Record the outcome of each check; do not mark this task complete until all curl/artisan-verifiable checks pass, with browser-only checks explicitly listed as not verifiable from a session without browser access.

- [ ] **Step 2: Clean up**

Delete any test rows created during this regression pass so every resource shows exactly its original seeded content, and confirm the Dashboard's counts/activity reflect that clean state.
