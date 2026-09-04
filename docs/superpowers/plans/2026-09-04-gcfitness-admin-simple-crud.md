# GCFitness Admin Simple CRUD Implementation Plan (Phase 2, Plan 2 of 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The real admin chrome (collapsible sidebar, breadcrumbs, theme toggle, account menu) plus real CRUD for FAQs, Testimonials, Site Settings, and Social Links — replacing the source app's mocked-API admin UI for these four content types with a real Laravel backend, while keeping the source's exact designed UI (Sheet drawers, Tabs, tables/grids, delete confirmation, skeletons).

**Architecture:** Each resource gets one Laravel controller (`index`/`store`/`update`/`destroy`, no separate create/edit actions since the UI never navigates to a separate URL for them) and one Inertia page component that owns the Sheet-drawer create/edit/view state client-side, exactly like the source app. Forms use `@inertiajs/react`'s own `useForm` hook (`data`/`setData`/`post`/`put`/`processing`/`errors`/`isDirty`) end to end — not the source app's `react-hook-form` + `zod` + `axios`-based API client — since `useForm` already gives client state, server-validated `errors`, and dirty-tracking in one hook, and a second validation layer on top of it would duplicate Laravel's own Form Request validation for no benefit. This is Inertia-native, no JSON API layer, matching Plan 1's established pattern. The one narrow exception is image upload: a single small JSON endpoint (`POST /admin/uploads`) that the `ImageUpload` component calls directly on file-pick via plain `fetch`, matching the source app's exact "upload immediately, swap in the real URL" UX, which doesn't fit the surrounding form's own submit cycle.

**Tech Stack:** Laravel 12, Inertia.js v2, React 19, the shadcn/ui `Sidebar`/`Sheet`/`Tooltip`/`Breadcrumb`/`DropdownMenu`/`Table`/`Tabs`/`Card`/`Textarea`/`AlertDialog`/`Select`/`Skeleton`/`Separator` primitives (ported this plan), `sonner` toasts, Laravel's local public disk for image storage. `react-hook-form`/`zod`/`@hookform/resolvers` were installed in Plan 1 for source-UI-fidelity but are NOT used by this plan's forms (see Architecture) — they remain available for a later plan to adopt if a more complex form genuinely needs them.

**Spec:** `docs/superpowers/specs/2026-09-03-gcfitness-admin-cms-design.md`

## Global Constraints

- Inertia-native: no `routes/api.php`, no JSON API controllers, no `axios`, no React Query — the one narrow, explicitly-scoped exception is the image-upload endpoint (see Task 8), which exists only because the source app's exact UX immediately uploads on file-pick, independent of the surrounding form's submit cycle.
- Admin pages carry the real `AdminShell` (sidebar/breadcrumbs/topbar), never the public site's `SiteLayout` — every page component built in this plan sets `.layout = (page) => <AdminLayout>{page}</AdminLayout>;`.
- The sidebar nav only lists the resources that exist so far: this plan's four (FAQs, Testimonials, Site Settings, Social Links) plus the ones later plans add — never a link to a route that doesn't exist yet.
- `FaqController`, `TestimonialController`, `SocialLinkController`, `SiteSettingController` all live behind the `auth.admin` middleware group established in Plan 1 (`routes/web.php`) — never the stock `auth` alias.
- Reuse the existing `Faq` and `Testimonial` Eloquent models from phase 1 as-is (no migration changes) — their real seeded content (the site's actual FAQ/testimonial copy) must not be overwritten by this plan's work.
- `SiteSetting`'s admin form is adapted to the project's actual schema (`address_line1`/`address_line2`, two fields) rather than the source app's single `address` field, since phase 1 built the real schema this way — documented in Task 13, not a silent deviation.
- `SocialLink` is a new model (dropped from phase 1's scope) — admin-manageable starting this plan, but the public footer is intentionally NOT wired to consume it yet (that remains phase 1's hardcoded footer, per the spec).
- No CSS token exists for `bg-sidebar`/`text-sidebar-foreground`/`bg-sidebar-accent`/etc. anywhere in the source app's own stylesheet (verified: grepped the entire source `src/` tree, found nothing) — the shadcn `Sidebar` component's own classes reference these tokens, but since the source app never defined them either, this plan ports the CSS exactly as the source has it (no sidebar-specific tokens invented) and lets those specific utility classes resolve to nothing, faithfully matching the source app's actual (undifferentiated-background) sidebar appearance rather than inventing a design the source doesn't have.
- Every task ends with a concrete, curl/artisan-verifiable step — this session still has no browser-automation tool, so full visual/interactive confirmation (does the sidebar actually collapse, does the theme toggle actually recolor it, do the Sheet drawers actually animate) remains an outstanding manual check for a human, exactly as flagged throughout phase 1 and Plan 1.

---

## Task 1: Port Skeleton, Separator, Tooltip, and Sheet

Foundational shadcn/ui primitives the Sidebar component (Task 2) is built on. Ports of `GC-Fitness-Rebrand/src/components/ui/{skeleton,separator,tooltip,sheet}.tsx`, framework-agnostic — no logic changes beyond stripping TypeScript types.

**Files:**
- Create: `resources/js/Components/ui/skeleton.jsx`
- Create: `resources/js/Components/ui/separator.jsx`
- Create: `resources/js/Components/ui/tooltip.jsx`
- Create: `resources/js/Components/ui/sheet.jsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`; `@radix-ui/react-separator`, `@radix-ui/react-tooltip`, `@radix-ui/react-dialog` (all installed in Plan 1's Task 1).
- Produces: `Skeleton`, `Separator`, `Tooltip`/`TooltipTrigger`/`TooltipContent`/`TooltipProvider`, `Sheet`/`SheetTrigger`/`SheetClose`/`SheetContent`/`SheetHeader`/`SheetFooter`/`SheetTitle`/`SheetDescription` from `@/Components/ui/{skeleton,separator,tooltip,sheet}` — consumed by Task 2 (Sidebar) and every later task's drawer-based forms in this plan.

- [ ] **Step 1: Port Skeleton**

Create `resources/js/Components/ui/skeleton.jsx`:

```jsx
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
    return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };
```

- [ ] **Step 2: Port Separator**

Create `resources/js/Components/ui/separator.jsx`:

```jsx
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef(
    ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
        <SeparatorPrimitive.Root
            ref={ref}
            decorative={decorative}
            orientation={orientation}
            className={cn(
                "shrink-0 bg-border",
                orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
                className,
            )}
            {...props}
        />
    ),
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
```

- [ ] **Step 3: Port Tooltip**

Create `resources/js/Components/ui/tooltip.jsx`:

```jsx
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)",
                className,
            )}
            {...props}
        />
    </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
```

- [ ] **Step 4: Port Sheet**

Create `resources/js/Components/ui/sheet.jsx`:

```jsx
import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (
    <SheetPrimitive.Overlay
        className={cn(
            "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className,
        )}
        {...props}
        ref={ref}
    />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
    "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
    {
        variants: {
            side: {
                top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
                bottom:
                    "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
                left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
                right:
                    "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
            },
        },
        defaultVariants: {
            side: "right",
        },
    },
);

const SheetContent = React.forwardRef(({ side = "right", className, children, ...props }, ref) => (
    <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
            <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </SheetPrimitive.Close>
            {children}
        </SheetPrimitive.Content>
    </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }) => (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
    <SheetPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-foreground", className)} {...props} />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
    <SheetPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
    Sheet,
    SheetPortal,
    SheetOverlay,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
};
```

- [ ] **Step 5: Verify**

Run: `npm run build`

Expected: succeeds (nothing renders these yet).

- [ ] **Step 6: Commit**

```bash
git add resources/js/Components/ui/skeleton.jsx resources/js/Components/ui/separator.jsx resources/js/Components/ui/tooltip.jsx resources/js/Components/ui/sheet.jsx
git commit -m "feat: port Skeleton, Separator, Tooltip, Sheet shadcn/ui primitives"
```

---

## Task 2: Port the Sidebar component and its `useIsMobile` hook

The largest single shadcn/ui primitive — the collapsible sidebar mechanics (desktop icon-collapse, mobile Sheet-based drawer, cookie-persisted open state, keyboard shortcut). Ports of `GC-Fitness-Rebrand/src/components/ui/sidebar.tsx` and `GC-Fitness-Rebrand/src/hooks/use-mobile.tsx` verbatim (TypeScript types stripped, no logic changes).

**Files:**
- Create: `resources/js/hooks/use-mobile.js`
- Create: `resources/js/Components/ui/sidebar.jsx`

**Interfaces:**
- Consumes: `useIsMobile` (this task, internal); `cn` from `@/lib/utils`; `Button`, `Input` (phase 1, Task 4/Plan 1 Task 2), `Separator`, `Sheet`/`SheetContent`/`SheetDescription`/`SheetHeader`/`SheetTitle`, `Skeleton`, `Tooltip`/`TooltipContent`/`TooltipProvider`/`TooltipTrigger` (this plan's Task 1).
- Produces: `Sidebar`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupAction`, `SidebarGroupContent`, `SidebarGroupLabel`, `SidebarHeader`, `SidebarInput`, `SidebarInset`, `SidebarMenu`, `SidebarMenuAction`, `SidebarMenuBadge`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarMenuSkeleton`, `SidebarMenuSub`, `SidebarMenuSubButton`, `SidebarMenuSubItem`, `SidebarProvider`, `SidebarRail`, `SidebarSeparator`, `SidebarTrigger`, `useSidebar` from `@/Components/ui/sidebar` — consumed by Task 5's `AdminShell`.

- [ ] **Step 1: Port the `useIsMobile` hook**

Create `resources/js/hooks/use-mobile.js`:

```js
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState(undefined);

    React.useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
        const onChange = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };
        mql.addEventListener("change", onChange);
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    return !!isMobile;
}
```

- [ ] **Step 2: Port the Sidebar component**

Create `resources/js/Components/ui/sidebar.jsx`:

```jsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Separator } from "@/Components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/Components/ui/sheet";
import { Skeleton } from "@/Components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/Components/ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

const SidebarContext = React.createContext(null);

function useSidebar() {
    const context = React.useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider.");
    }

    return context;
}

const SidebarProvider = React.forwardRef(
    ({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
        const isMobile = useIsMobile();
        const [openMobile, setOpenMobile] = React.useState(false);

        const [_open, _setOpen] = React.useState(defaultOpen);
        const open = openProp ?? _open;
        const setOpen = React.useCallback(
            (value) => {
                const openState = typeof value === "function" ? value(open) : value;
                if (setOpenProp) {
                    setOpenProp(openState);
                } else {
                    _setOpen(openState);
                }

                document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
            },
            [setOpenProp, open],
        );

        const toggleSidebar = React.useCallback(() => {
            return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
        }, [isMobile, setOpen, setOpenMobile]);

        React.useEffect(() => {
            const handleKeyDown = (event) => {
                if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    toggleSidebar();
                }
            };

            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }, [toggleSidebar]);

        const state = open ? "expanded" : "collapsed";

        const contextValue = React.useMemo(
            () => ({
                state,
                open,
                setOpen,
                isMobile,
                openMobile,
                setOpenMobile,
                toggleSidebar,
            }),
            [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
        );

        return (
            <SidebarContext.Provider value={contextValue}>
                <TooltipProvider delayDuration={0}>
                    <div
                        style={{
                            "--sidebar-width": SIDEBAR_WIDTH,
                            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                            ...style,
                        }}
                        className={cn(
                            "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
                            className,
                        )}
                        ref={ref}
                        {...props}
                    >
                        {children}
                    </div>
                </TooltipProvider>
            </SidebarContext.Provider>
        );
    },
);
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef(
    ({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
        const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

        if (collapsible === "none") {
            return (
                <div
                    className={cn("flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground", className)}
                    ref={ref}
                    {...props}
                >
                    {children}
                </div>
            );
        }

        if (isMobile) {
            return (
                <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
                    <SheetContent
                        data-sidebar="sidebar"
                        data-mobile="true"
                        className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
                        style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE }}
                        side={side}
                    >
                        <SheetHeader className="sr-only">
                            <SheetTitle>Sidebar</SheetTitle>
                            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
                        </SheetHeader>
                        <div className="flex h-full w-full flex-col">{children}</div>
                    </SheetContent>
                </Sheet>
            );
        }

        return (
            <div
                ref={ref}
                className="group peer hidden text-sidebar-foreground md:block"
                data-state={state}
                data-collapsible={state === "collapsed" ? collapsible : ""}
                data-variant={variant}
                data-side={side}
            >
                <div
                    className={cn(
                        "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
                        "group-data-[collapsible=offcanvas]:w-0",
                        "group-data-[side=right]:rotate-180",
                        variant === "floating" || variant === "inset"
                            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
                            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
                    )}
                />
                <div
                    className={cn(
                        "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
                        side === "left"
                            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
                            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
                        variant === "floating" || variant === "inset"
                            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
                            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
                        className,
                    )}
                    {...props}
                >
                    <div
                        data-sidebar="sidebar"
                        className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
                    >
                        {children}
                    </div>
                </div>
            </div>
        );
    },
);
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef(({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();

    return (
        <Button
            ref={ref}
            data-sidebar="trigger"
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", className)}
            onClick={(event) => {
                onClick?.(event);
                toggleSidebar();
            }}
            {...props}
        >
            <PanelLeft />
            <span className="sr-only">Toggle Sidebar</span>
        </Button>
    );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = React.forwardRef(({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();

    return (
        <button
            ref={ref}
            data-sidebar="rail"
            aria-label="Toggle Sidebar"
            tabIndex={-1}
            onClick={toggleSidebar}
            title="Toggle Sidebar"
            className={cn(
                "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
                "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
                "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
                "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
                "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
                "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
                className,
            )}
            {...props}
        />
    );
});
SidebarRail.displayName = "SidebarRail";

const SidebarInset = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <main
            ref={ref}
            className={cn(
                "relative flex w-full flex-1 flex-col bg-background",
                "md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
                className,
            )}
            {...props}
        />
    );
});
SidebarInset.displayName = "SidebarInset";

const SidebarInput = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <Input
            ref={ref}
            data-sidebar="input"
            className={cn("h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring", className)}
            {...props}
        />
    );
});
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => {
    return <div ref={ref} data-sidebar="header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => {
    return <div ref={ref} data-sidebar="footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />;
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <Separator ref={ref} data-sidebar="separator" className={cn("mx-2 w-auto bg-sidebar-border", className)} {...props} />
    );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <div
            ref={ref}
            data-sidebar="content"
            className={cn(
                "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
                className,
            )}
            {...props}
        />
    );
});
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => {
    return <div ref={ref} data-sidebar="group" className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />;
});
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";

    return (
        <Comp
            ref={ref}
            data-sidebar="group-label"
            className={cn(
                "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
                className,
            )}
            {...props}
        />
    );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = React.forwardRef(({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            ref={ref}
            data-sidebar="group-action"
            className={cn(
                "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
                "after:absolute after:-inset-2 after:md:hidden",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            {...props}
        />
    );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} data-sidebar="group-content" className={cn("w-full text-sm", className)} {...props} />
));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef(({ className, ...props }, ref) => (
    <ul ref={ref} data-sidebar="menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef(({ className, ...props }, ref) => (
    <li ref={ref} data-sidebar="menu-item" className={cn("group/menu-item relative", className)} {...props} />
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
    "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring cursor-pointer transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                outline:
                    "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
            },
            size: {
                default: "h-8 text-sm",
                sm: "h-7 text-xs",
                lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

const SidebarMenuButton = React.forwardRef(
    ({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        const { isMobile, state } = useSidebar();

        const button = (
            <Comp
                ref={ref}
                data-sidebar="menu-button"
                data-size={size}
                data-active={isActive}
                className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
                {...props}
            />
        );

        if (!tooltip) {
            return button;
        }

        if (typeof tooltip === "string") {
            tooltip = {
                children: tooltip,
            };
        }

        return (
            <Tooltip>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile} {...tooltip} />
            </Tooltip>
        );
    },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = React.forwardRef(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
        <Comp
            ref={ref}
            data-sidebar="menu-action"
            className={cn(
                "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
                "after:absolute after:-inset-2 after:md:hidden",
                "peer-data-[size=sm]/menu-button:top-1",
                "peer-data-[size=default]/menu-button:top-1.5",
                "peer-data-[size=lg]/menu-button:top-2.5",
                "group-data-[collapsible=icon]:hidden",
                showOnHover &&
                    "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
                className,
            )}
            {...props}
        />
    );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        data-sidebar="menu-badge"
        className={cn(
            "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground",
            "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
            "peer-data-[size=sm]/menu-button:top-1",
            "peer-data-[size=default]/menu-button:top-1.5",
            "peer-data-[size=lg]/menu-button:top-2.5",
            "group-data-[collapsible=icon]:hidden",
            className,
        )}
        {...props}
    />
));
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = React.forwardRef(({ className, showIcon = false, ...props }, ref) => {
    const width = React.useMemo(() => {
        return `${Math.floor(Math.random() * 40) + 50}%`;
    }, []);

    return (
        <div ref={ref} data-sidebar="menu-skeleton" className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)} {...props}>
            {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
            <Skeleton
                className="h-4 max-w-(--skeleton-width) flex-1"
                data-sidebar="menu-skeleton-text"
                style={{ "--skeleton-width": width }}
            />
        </div>
    );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = React.forwardRef(({ className, ...props }, ref) => (
    <ul
        ref={ref}
        data-sidebar="menu-sub"
        className={cn(
            "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
            "group-data-[collapsible=icon]:hidden",
            className,
        )}
        {...props}
    />
));
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = React.forwardRef(({ ...props }, ref) => <li ref={ref} {...props} />);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = React.forwardRef(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";

    return (
        <Comp
            ref={ref}
            data-sidebar="menu-sub-button"
            data-size={size}
            data-active={isActive}
            className={cn(
                "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
                "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
                size === "sm" && "text-xs",
                size === "md" && "text-sm",
                "group-data-[collapsible=icon]:hidden",
                className,
            )}
            {...props}
        />
    );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarInset,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
    SidebarSeparator,
    SidebarTrigger,
    useSidebar,
};
```

- [ ] **Step 3: Verify**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add resources/js/hooks/use-mobile.js resources/js/Components/ui/sidebar.jsx
git commit -m "feat: port Sidebar shadcn/ui primitive and useIsMobile hook"
```

---

## Task 3: Port Breadcrumb and DropdownMenu

The remaining two shadcn/ui primitives `AdminShell` needs directly (beyond what Task 2's Sidebar already brought in). Ports of `GC-Fitness-Rebrand/src/components/ui/{breadcrumb,dropdown-menu}.tsx` verbatim.

**Files:**
- Create: `resources/js/Components/ui/breadcrumb.jsx`
- Create: `resources/js/Components/ui/dropdown-menu.jsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`; `@radix-ui/react-dropdown-menu` (installed in Plan 1's Task 1).
- Produces: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis` from `@/Components/ui/breadcrumb`; `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuRadioGroup` from `@/Components/ui/dropdown-menu` — consumed by Task 5's `AdminShell` and every later task's row-action menus (FAQs, Testimonials, Social Links).

- [ ] **Step 1: Port Breadcrumb**

Create `resources/js/Components/ui/breadcrumb.jsx`:

```jsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

const Breadcrumb = React.forwardRef(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef(({ className, ...props }, ref) => (
    <ol
        ref={ref}
        className={cn("flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5", className)}
        {...props}
    />
));
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef(({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />
));
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef(({ asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "a";

    return <Comp ref={ref} className={cn("transition-colors hover:text-foreground", className)} {...props} />;
});
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef(({ className, ...props }, ref) => (
    <span
        ref={ref}
        role="link"
        aria-disabled="true"
        aria-current="page"
        className={cn("font-normal text-foreground", className)}
        {...props}
    />
));
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({ children, className, ...props }) => (
    <li role="presentation" aria-hidden="true" className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)} {...props}>
        {children ?? <ChevronRight />}
    </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({ className, ...props }) => (
    <span role="presentation" aria-hidden="true" className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">More</span>
    </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";

export { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis };
```

- [ ] **Step 2: Port DropdownMenu**

Create `resources/js/Components/ui/dropdown-menu.jsx`:

```jsx
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef(({ className, inset, children, ...props }, ref) => (
    <DropdownMenuPrimitive.SubTrigger
        ref={ref}
        className={cn(
            "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
            inset && "pl-8",
            className,
        )}
        {...props}
    >
        {children}
        <ChevronRight className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.SubContent
        ref={ref}
        className={cn(
            "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
            className,
        )}
        {...props}
    />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
    <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
            ref={ref}
            sideOffset={sideOffset}
            className={cn(
                "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
                "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
                className,
            )}
            {...props}
        />
    </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
            inset && "pl-8",
            className,
        )}
        {...props}
    />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef(({ className, children, checked, ...props }, ref) => (
    <DropdownMenuPrimitive.CheckboxItem
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className,
        )}
        checked={checked}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <Check className="h-4 w-4" />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef(({ className, children, ...props }, ref) => (
    <DropdownMenuPrimitive.RadioItem
        ref={ref}
        className={cn(
            "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className,
        )}
        {...props}
    >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
            <DropdownMenuPrimitive.ItemIndicator>
                <Circle className="h-2 w-2 fill-current" />
            </DropdownMenuPrimitive.ItemIndicator>
        </span>
        {children}
    </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef(({ className, inset, ...props }, ref) => (
    <DropdownMenuPrimitive.Label ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef(({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }) => {
    return <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />;
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuGroup,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
};
```

- [ ] **Step 3: Verify**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add resources/js/Components/ui/breadcrumb.jsx resources/js/Components/ui/dropdown-menu.jsx
git commit -m "feat: port Breadcrumb and DropdownMenu shadcn/ui primitives"
```

---

## Task 4: Admin nav items and breadcrumb-trail logic

Pure, presentation-free modules: the sidebar's nav entries (this plan's 4 resources only — later plans append theirs) and the pure function that turns the current URL into a breadcrumb trail. Ports of `GC-Fitness-Rebrand/src/components/admin/shared/{admin-nav-items,breadcrumb-segments}.ts`, adapted for this plan's narrower resource set and Inertia's `usePage().url` instead of TanStack Router's `useLocation()`.

**Files:**
- Create: `resources/js/Components/admin/adminNavItems.js`
- Create: `resources/js/Components/admin/breadcrumbSegments.js`

**Interfaces:**
- Produces: `CONTENT_NAV_ITEMS`, `SITE_INFO_NAV_ITEMS` (arrays of `{ to, label, icon }`) from `@/Components/admin/adminNavItems`; `getBreadcrumbSegments(pathname, search)` (returns `{ label, to? }[]`) from `@/Components/admin/breadcrumbSegments` — both consumed by Task 5's `AdminShell`. Later plans (3-5) import `CONTENT_NAV_ITEMS`/`SITE_INFO_NAV_ITEMS` from this exact file to append their own resources' entries.

- [ ] **Step 1: Create the nav items module**

The source app's full nav has 10 entries (5 Content + 5 Site info); this plan builds only 2 of the 5 Content-group resources (Testimonials, FAQs) and 2 of the 5 Site-info-group resources (Site Settings, Social Links) — the other 6 entries (Programs, Trainers, Membership Plans, Company Stats, Club Locations, Trusted Partners) are added by later phase-2 plans as those resources are built, never linked here ahead of time. Create `resources/js/Components/admin/adminNavItems.js`:

```js
import { MessageSquareQuote, HelpCircle, Settings, Share2 } from "lucide-react";

export const CONTENT_NAV_ITEMS = [
    { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
];

export const SITE_INFO_NAV_ITEMS = [
    { to: "/admin/site-settings", label: "Site Settings", icon: Settings },
    { to: "/admin/social-links", label: "Social Links", icon: Share2 },
];
```

- [ ] **Step 2: Create the breadcrumb-segments module**

Create `resources/js/Components/admin/breadcrumbSegments.js`:

```js
import { CONTENT_NAV_ITEMS, SITE_INFO_NAV_ITEMS } from "./adminNavItems";

const DASHBOARD_PATH = "/admin/dashboard";
const DASHBOARD_LABEL = "Dashboard";

const ALL_NAV_ITEMS = [...CONTENT_NAV_ITEMS, ...SITE_INFO_NAV_ITEMS];

export function getBreadcrumbSegments(pathname, search) {
    if (pathname === DASHBOARD_PATH) {
        return [{ label: DASHBOARD_LABEL, to: DASHBOARD_PATH }];
    }

    const segments = [{ label: DASHBOARD_LABEL, to: DASHBOARD_PATH }];

    const matchedNavItem = ALL_NAV_ITEMS.find((item) => pathname.startsWith(item.to));

    if (!matchedNavItem) {
        return segments;
    }

    segments.push({ label: matchedNavItem.label, to: matchedNavItem.to });

    const remainder = pathname.slice(matchedNavItem.to.length).replace(/^\/+|\/+$/g, "");

    if (remainder.length > 0) {
        const lastPathSegment = remainder.split("/").pop();

        let label;
        if (lastPathSegment === "new") {
            label = "Add";
        } else if (search.mode === "view") {
            label = "View";
        } else {
            label = "Edit";
        }

        segments.push({ label });
    }

    return segments;
}
```

This plan's 4 resources never actually produce a URL with a trailing sub-segment (no separate create/edit/view route — everything happens in a Sheet drawer on the index page), so the `remainder`-handling branch here is dead code for now, exactly ported for when a later plan's Programs/Trainers/Membership Plans DO use separate `$id` edit routes and need it.

- [ ] **Step 3: Verify**

Run: `node -e "const {getBreadcrumbSegments} = require('./resources/js/Components/admin/breadcrumbSegments.js'); console.log(JSON.stringify(getBreadcrumbSegments('/admin/dashboard', {}))); console.log(JSON.stringify(getBreadcrumbSegments('/admin/faqs', {})));"`

This uses Node's CommonJS `require` against an ES module file, which will fail with a syntax error — that's expected and fine; this step exists only to catch a typo by attempting to load the file. If the `require` fails specifically with an `import`/`export` syntax error, that confirms the file parses as valid JS syntax otherwise. (The real functional verification happens in Task 5's browser/curl check, once `AdminShell` actually renders a breadcrumb using this function.)

- [ ] **Step 4: Commit**

```bash
git add resources/js/Components/admin/adminNavItems.js resources/js/Components/admin/breadcrumbSegments.js
git commit -m "feat: add admin nav items and breadcrumb-segment logic"
```

---

## Task 5: Build AdminShell and wire it in as the real admin layout

Assembles Tasks 1-4 into the persistent admin chrome — sidebar (grouped Content/Site info nav), breadcrumb trail, theme toggle, account dropdown with logout — and replaces the placeholder `.layout = (page) => page;` on `Admin/Dashboard` with a real `AdminLayout` wrapping `AdminShell`. Port of `GC-Fitness-Rebrand/src/components/admin/shared/admin-shell.tsx`, adapted: `useLocation`/`useNavigate` (TanStack Router) → Inertia's `usePage()` for the current URL and `router.post` for logout; `authApi.logout()` + client-side navigate → a real POST to `/admin/logout` (already built in Plan 1); the cached-profile `getUser()?.name` → the authenticated user's real `name`, shared as an Inertia prop.

**Files:**
- Modify: `app/Http/Middleware/HandleInertiaRequests.php`
- Create: `resources/js/Components/admin/AdminShell.jsx`
- Create: `resources/js/Layouts/AdminLayout.jsx`
- Modify: `resources/js/Pages/Admin/Dashboard.jsx`

**Interfaces:**
- Consumes: `Sidebar`* (Task 2), `Breadcrumb`*, `DropdownMenu`* (Task 3), `Separator` (Task 1), `CONTENT_NAV_ITEMS`/`SITE_INFO_NAV_ITEMS`, `getBreadcrumbSegments` (Task 4); `ThemeProvider`/`useTheme` (phase 1); `Toaster` (this task, new — see Step 2).
- Produces: `AdminShell` from `@/Components/admin/AdminShell`; `AdminLayout` (default export) from `@/Layouts/AdminLayout` — consumed by every admin page task from here on (this plan's Tasks 10-13, and every later phase-2 plan's pages).

- [ ] **Step 1: Share the authenticated admin's name via Inertia**

`AdminShell`'s account menu needs the logged-in admin's display name. Add it to Inertia's shared props in `app/Http/Middleware/HandleInertiaRequests.php` — read the file first (it already shares `flash.message` and `status` from Plan 1's Task 5 fix; add alongside those, don't remove them):

```php
'auth' => fn () => [
    'user' => $request->user() ? ['name' => $request->user()->name] : null,
],
```

- [ ] **Step 2: Port the sonner Toaster wrapper**

`AdminShell` mounts this once so every later task's `toast.success()`/`toast.error()` calls just work. Port of `GC-Fitness-Rebrand/src/components/ui/sonner.tsx`. Create `resources/js/Components/ui/sonner.jsx`:

```jsx
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
    return (
        <Sonner
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
```

- [ ] **Step 3: Build AdminShell**

Create `resources/js/Components/admin/AdminShell.jsx`:

```jsx
import { Fragment } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { LayoutDashboard, Sun, Moon, LogOut, ExternalLink } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Separator } from "@/Components/ui/separator";
import { Toaster } from "@/Components/ui/sonner";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import { useTheme } from "@/Components/ThemeProvider";
import { CONTENT_NAV_ITEMS, SITE_INFO_NAV_ITEMS } from "./adminNavItems";
import { getBreadcrumbSegments } from "./breadcrumbSegments";

export function AdminShell({ children }) {
    const { url, props } = usePage();
    const [pathname, search] = url.split("?");
    const searchParams = Object.fromEntries(new URLSearchParams(search ?? ""));
    const breadcrumbSegments = getBreadcrumbSegments(pathname, searchParams);
    const { theme, toggle } = useTheme();
    const adminName = props.auth?.user?.name ?? "Admin";

    function handleLogout() {
        router.post("/admin/logout");
    }

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <div className="flex items-center gap-2 px-2 py-1">
                        <span className="font-hero text-lg uppercase tracking-widest text-brand">GC</span>
                        <span className="text-sm font-medium text-muted-foreground">Fitness CMS</span>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={pathname === "/admin/dashboard"}>
                                        <Link href="/admin/dashboard">
                                            <LayoutDashboard />
                                            <span>Dashboard</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarGroup>
                        <SidebarGroupLabel>Content</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {CONTENT_NAV_ITEMS.map((item) => (
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

                    <SidebarGroup>
                        <SidebarGroupLabel>Site info</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {SITE_INFO_NAV_ITEMS.map((item) => (
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
                </SidebarContent>

                <SidebarFooter>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton>
                                <span className="flex size-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                                    {adminName.charAt(0).toUpperCase()}
                                </span>
                                <span>{adminName}</span>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start" className="w-56">
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 size-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex h-14 items-center justify-between border-b border-border px-4">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger />
                        <Separator orientation="vertical" className="h-5" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbSegments.map((segment, index) => {
                                    const isLastSegment = index === breadcrumbSegments.length - 1;
                                    return (
                                        <Fragment key={`${segment.label}-${index}`}>
                                            <BreadcrumbItem>
                                                {isLastSegment ? (
                                                    <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink asChild>
                                                        <Link href={segment.to}>{segment.label}</Link>
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {!isLastSegment && <BreadcrumbSeparator />}
                                        </Fragment>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href="/"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            View live site
                            <ExternalLink className="size-3.5" />
                        </a>
                        <Separator orientation="vertical" className="h-5" />
                        <button
                            onClick={toggle}
                            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    );
}
```

- [ ] **Step 4: Build the AdminLayout wrapper**

A thin named layout so every admin page sets `.layout = (page) => <AdminLayout>{page}</AdminLayout>;`, matching the pattern phase 1's `SiteLayout` established for public pages. `AdminShell` doesn't wrap itself in `ThemeProvider` the way phase 1's `SiteLayout` does — reusing the exact same `ThemeProvider` instance for both would require a shared root, which doesn't exist between the public site and `/admin/*` (each admin page opts out of the public layout entirely, same as the auth pages from Plan 1). `AdminLayout` provides its own `ThemeProvider` instance, scoped to the admin section, matching the source app's own root component branching admin vs. public into two independent `ThemeProvider` trees. Create `resources/js/Layouts/AdminLayout.jsx`:

```jsx
import { ThemeProvider } from "@/Components/ThemeProvider";
import { AdminShell } from "@/Components/admin/AdminShell";

export default function AdminLayout({ children }) {
    return (
        <ThemeProvider>
            <AdminShell>{children}</AdminShell>
        </ThemeProvider>
    );
}
```

- [ ] **Step 5: Wire the Dashboard page to the real shell**

Replace `resources/js/Pages/Admin/Dashboard.jsx` entirely — it keeps its placeholder welcome content (the real dashboard widgets are a later phase-2 plan) but now renders inside the real `AdminShell` instead of bare, and the sign-out button becomes a plain link to the account-menu's logout action instead of duplicating it (the shell's account dropdown already has "Log out"):

```jsx
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";

function DashboardPage() {
    return (
        <>
            <Head title="Dashboard — GCFitness Admin" />
            <div>
                <h1 className="text-2xl font-semibold">Welcome back</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    The full dashboard (stats, activity, charts) is built in a later phase-2 plan.
                </p>
            </div>
        </>
    );
}

DashboardPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default DashboardPage;
```

- [ ] **Step 6: Verify**

Start `php artisan serve` and `npm run dev` (check if already running). Log in via the curl cookie-jar+XSRF pattern established in Plan 1's Tasks 4-6 (`admin@gcfitness.club` / `password`), then fetch `/admin/dashboard` with that session and confirm:
- HTTP 200, `"component":"Admin/Dashboard"` in the Inertia payload.
- The payload's shared props include `auth.user.name` (e.g. `"GCFitness Admin"`).
- No PHP errors in `storage/logs/laravel.log`.

As with every prior admin-page task, full visual/interactive confirmation (does the sidebar actually collapse, does the breadcrumb actually render 2 segments, does the theme toggle actually recolor it) is not possible from this session — flag it for a human to check in a real browser.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Middleware/HandleInertiaRequests.php resources/js/Components/ui/sonner.jsx resources/js/Components/admin/AdminShell.jsx resources/js/Layouts/AdminLayout.jsx resources/js/Pages/Admin/Dashboard.jsx
git commit -m "feat: build AdminShell and wire it as the real admin layout"
```

---

## Task 6: Port Table, Tabs, Card, Textarea, AlertDialog, and Select

The remaining shadcn/ui primitives this plan's 4 resources need — none of these depend on anything from Tasks 1-5 beyond `cn`/`buttonVariants`. Ports of `GC-Fitness-Rebrand/src/components/ui/{table,tabs,card,textarea,alert-dialog,select}.tsx` verbatim.

**Files:**
- Create: `resources/js/Components/ui/table.jsx`
- Create: `resources/js/Components/ui/tabs.jsx`
- Create: `resources/js/Components/ui/card.jsx`
- Create: `resources/js/Components/ui/textarea.jsx`
- Create: `resources/js/Components/ui/alert-dialog.jsx`
- Create: `resources/js/Components/ui/select.jsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`; `buttonVariants` from `@/Components/ui/button` (phase 1); `@radix-ui/react-tabs`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-select` (installed in Plan 1's Task 1).
- Produces: `Table`/`TableHeader`/`TableBody`/`TableFooter`/`TableHead`/`TableRow`/`TableCell`/`TableCaption`; `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`; `Card`/`CardHeader`/`CardFooter`/`CardTitle`/`CardDescription`/`CardContent`; `Textarea`; `AlertDialog`/`AlertDialogPortal`/`AlertDialogOverlay`/`AlertDialogTrigger`/`AlertDialogContent`/`AlertDialogHeader`/`AlertDialogFooter`/`AlertDialogTitle`/`AlertDialogDescription`/`AlertDialogAction`/`AlertDialogCancel`; `Select`/`SelectGroup`/`SelectValue`/`SelectTrigger`/`SelectContent`/`SelectLabel`/`SelectItem`/`SelectSeparator`/`SelectScrollUpButton`/`SelectScrollDownButton` — consumed by Task 7 (delete dialog) and Tasks 9-12 (all 4 resources' lists/forms).

- [ ] **Step 1: Port Table**

Create `resources/js/Components/ui/table.jsx`:

```jsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef(({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
        <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef(({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef(({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef(({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef(({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className)} {...props} />
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef(({ className, ...props }, ref) => (
    <th
        ref={ref}
        className={cn(
            "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
            className,
        )}
        {...props}
    />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef(({ className, ...props }, ref) => (
    <td
        ref={ref}
        className={cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className)}
        {...props}
    />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef(({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
```

- [ ] **Step 2: Port Tabs**

Create `resources/js/Components/ui/tabs.jsx`:

```jsx
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.List
        ref={ref}
        className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground", className)}
        {...props}
    />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
            className,
        )}
        {...props}
    />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}
        {...props}
    />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

- [ ] **Step 3: Port Card**

Create `resources/js/Components/ui/card.jsx`:

```jsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

- [ ] **Step 4: Port Textarea**

Create `resources/js/Components/ui/textarea.jsx`:

```jsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <textarea
            className={cn(
                "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                className,
            )}
            ref={ref}
            {...props}
        />
    );
});
Textarea.displayName = "Textarea";

export { Textarea };
```

- [ ] **Step 5: Port AlertDialog**

Create `resources/js/Components/ui/alert-dialog.jsx`:

```jsx
import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/Components/ui/button";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Overlay
        className={cn(
            "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className,
        )}
        {...props}
        ref={ref}
    />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogPrimitive.Content
            ref={ref}
            className={cn(
                "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
                className,
            )}
            {...props}
        />
    </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({ className, ...props }) => (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({ className, ...props }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants(), className)} {...props} />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
    <AlertDialogPrimitive.Cancel ref={ref} className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)} {...props} />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
    AlertDialog,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
};
```

- [ ] **Step 6: Port Select**

Create `resources/js/Components/ui/select.jsx`:

```jsx
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
            className,
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton ref={ref} className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
        <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton ref={ref} className={cn("flex cursor-default items-center justify-center py-1", className)} {...props}>
        <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            className={cn(
                "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)",
                position === "popper" &&
                    "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
                className,
            )}
            position={position}
            {...props}
        >
            <SelectScrollUpButton />
            <SelectPrimitive.Viewport
                className={cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}
            >
                {children}
            </SelectPrimitive.Viewport>
            <SelectScrollDownButton />
        </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
    <SelectPrimitive.Label ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", className)} {...props} />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className,
        )}
        {...props}
    >
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <Check className="h-4 w-4" />
            </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
};
```

- [ ] **Step 7: Verify**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 8: Commit**

```bash
git add resources/js/Components/ui/table.jsx resources/js/Components/ui/tabs.jsx resources/js/Components/ui/card.jsx resources/js/Components/ui/textarea.jsx resources/js/Components/ui/alert-dialog.jsx resources/js/Components/ui/select.jsx
git commit -m "feat: port Table, Tabs, Card, Textarea, AlertDialog, Select shadcn/ui primitives"
```

---

## Task 7: Shared admin component — DeleteConfirmDialog

Port of `GC-Fitness-Rebrand/src/components/admin/shared/delete-confirm-dialog.tsx` verbatim — a pure presentational component with no router/API dependency.

**Deliberately NOT porting `table-skeleton.tsx`/`card-grid-skeleton.tsx`/`form-skeleton.tsx` here.** The source app needs those because its pages fetch data client-side after mount (a real network round-trip with a loading gap to fill). This project's Inertia pages never have that gap — the server always supplies a page's data as props before the page renders at all, so there is no "loading" state for an index/edit page's own data anywhere in this plan's 4 resources, and no consumer for those 3 skeletons would exist. Building them now would be exactly the kind of speculative, no-current-caller code this project avoids elsewhere (YAGNI) — if a future plan's dashboard uses Inertia's deferred-props feature (a real mechanism that DOES need a loading fallback), that plan can port the specific skeleton it needs then, with a real caller to justify it.

**Files:**
- Create: `resources/js/Components/admin/DeleteConfirmDialog.jsx`

**Interfaces:**
- Consumes: `AlertDialog`* (Task 6).
- Produces: `DeleteConfirmDialog({ open, onOpenChange, itemLabel, onConfirm })` from `@/Components/admin/DeleteConfirmDialog` — consumed by Tasks 10-12's list/grid pages (FAQs, Testimonials, Social Links; Site Settings has no delete action, being a singleton record).

- [ ] **Step 1: Port DeleteConfirmDialog**

Create `resources/js/Components/admin/DeleteConfirmDialog.jsx`:

```jsx
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/Components/ui/alert-dialog";

export function DeleteConfirmDialog({ open, onOpenChange, itemLabel, onConfirm }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {itemLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>This can't be undone. {itemLabel} will be permanently removed.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
```

- [ ] **Step 2: Verify**

Run: `npm run build`

Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add resources/js/Components/admin/DeleteConfirmDialog.jsx
git commit -m "feat: port DeleteConfirmDialog"
```

---

## Task 8: Image upload endpoint and the shared ImageUpload control

The one deliberate exception to "no JSON API layer" in this whole phase (see Global Constraints): the source app's `ImageUpload` control uploads a file the instant it's picked/dropped — independent of the surrounding form's own submit cycle, showing an immediate local preview and then swapping in the real stored URL once the upload resolves. That doesn't fit an Inertia form's own `post`/`put` submit flow, so it gets its own tiny, narrowly-scoped JSON endpoint. Port of `GC-Fitness-Rebrand/src/components/admin/shared/image-upload.tsx`, adapted: `uploadApi.upload(file, uploadType)` (axios) → a plain `fetch` to the new endpoint, with the CSRF token read from Laravel's `XSRF-TOKEN` cookie (the same mechanism this plan's every curl-based verification step already uses).

**Files:**
- Create: `app/Http/Controllers/Admin/UploadController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Components/admin/ImageUpload.jsx`

**Interfaces:**
- Consumes: nothing from earlier tasks in this plan.
- Produces: `POST /admin/uploads` (behind `auth.admin`), returning `{ "url": "/storage/uploads/<type>/<filename>" }`; `ImageUpload({ value, onChange, uploadType, disabled? })` from `@/Components/admin/ImageUpload` — consumed by Task 10 (Social Links' logo field) and, in later plans, Partners/Programs/Trainers' image fields.

- [ ] **Step 1: Link the public storage disk**

Run: `php artisan storage:link`

Expected: creates `public/storage` as a symlink to `storage/app/public`, so files stored there are served at `/storage/...` URLs. (One-time setup — safe to re-run; Laravel skips it if the link already exists.)

- [ ] **Step 2: Create the upload controller**

Create `app/Http/Controllers/Admin/UploadController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'file' => ['required', 'image', 'max:5120'],
            'type' => ['required', 'string', 'in:social-link,partner,program,trainer'],
        ]);

        $path = $validated['file']->store('uploads/' . $validated['type'], 'public');

        return response()->json(['url' => Storage::url($path)]);
    }
}
```

`type` is validated against an explicit allow-list rather than any arbitrary string, both to keep the `storage/app/public/uploads/` directory tree predictable and because an unrecognized type is always a client bug, never a legitimate request. Only `social-link` is used by this plan; `partner`/`program`/`trainer` are included now since later phase-2 plans reuse this exact same endpoint for those resources' image fields — extending the allow-list, not duplicating the controller.

- [ ] **Step 3: Add the route**

In `routes/web.php`, add inside the existing `Route::middleware('auth.admin')->group(...)` block (alongside `dashboard` — read the file first, this group already exists from Plan 1's Task 3 and this plan's Task 5):

```php
Route::post('uploads', [UploadController::class, 'store'])->name('uploads.store');
```

Add `use App\Http\Controllers\Admin\UploadController;` to the file's imports.

- [ ] **Step 4: Port the ImageUpload component**

Create `resources/js/Components/admin/ImageUpload.jsx`:

```jsx
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function getXsrfToken() {
    const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export function ImageUpload({ value, onChange, uploadType, disabled = false }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    async function handleFile(file) {
        setError(null);
        onChange(URL.createObjectURL(file));
        setUploading(true);
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
            onChange(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
        } finally {
            setUploading(false);
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

- [ ] **Step 5: Verify**

Log in via the established curl cookie-jar+XSRF pattern, then POST a real small image file to `/admin/uploads`:

```bash
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST http://127.0.0.1:8000/admin/uploads \
  -H "X-XSRF-TOKEN: $XSRF_DECODED" \
  -H "Accept: application/json" \
  -F "type=social-link" \
  -F "file=@public/images/partners/partner1.png"
```

Expected: HTTP 200, JSON body `{"url":"/storage/uploads/social-link/<some-generated-filename>.png"}`. Then fetch that returned URL directly (`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000<returned-url>`) and confirm HTTP 200 — this proves `storage:link` actually made the uploaded file publicly servable, not just that the database/response claims success.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/Admin/UploadController.php routes/web.php resources/js/Components/admin/ImageUpload.jsx
git commit -m "feat: add image upload endpoint and shared ImageUpload control"
```

---

## Task 9: SocialLink model, migration, and seeder

`SocialLink` is a new model — dropped from phase 1's scope since the public footer only ever had unlabeled placeholder icons with no real content to seed. It becomes a real, admin-manageable resource starting this plan (per the spec), seeded with the same 3 platforms the source app's own mock data used, using a copied placeholder image for the logo (there is no real uploaded logo yet — an admin can replace it via Task 8's `ImageUpload` once this resource's admin page exists).

**Files:**
- Create: `public/images/placeholder-image.svg`
- Create: `database/migrations/2026_09_04_000001_create_social_links_table.php`
- Create: `app/Models/SocialLink.php`
- Create: `database/seeders/SocialLinkSeeder.php`
- Modify: `database/seeders/DatabaseSeeder.php`

**Interfaces:**
- Produces: `SocialLink` model with columns `platform, url, logo_path, sort_order`. Consumed by Task 10's controller/page. NOT consumed by any public-site page in this plan (the footer stays hardcoded, per the spec).

- [ ] **Step 1: Copy the placeholder image**

Copy `C:\Users\Project Office 6\Desktop\GC-Fitness-Rebrand\public\placeholder-image.svg` to `public/images/placeholder-image.svg` in this project.

- [ ] **Step 2: Create the migration**

Run: `php artisan make:migration create_social_links_table`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('social_links', function (Blueprint $table) {
            $table->id();
            $table->string('platform');
            $table->string('url');
            $table->string('logo_path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('social_links');
    }
};
```

- [ ] **Step 3: Create the model**

Create `app/Models/SocialLink.php`:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialLink extends Model
{
    protected $fillable = ['platform', 'url', 'logo_path', 'sort_order'];
}
```

- [ ] **Step 4: Create the seeder**

Create `database/seeders/SocialLinkSeeder.php`:

```php
<?php

namespace Database\Seeders;

use App\Models\SocialLink;
use Illuminate\Database\Seeder;

class SocialLinkSeeder extends Seeder
{
    public function run(): void
    {
        $links = [
            ['platform' => 'Instagram', 'url' => 'https://instagram.com/gcfitness'],
            ['platform' => 'Facebook', 'url' => 'https://facebook.com/gcfitness'],
            ['platform' => 'TikTok', 'url' => 'https://tiktok.com/@gcfitness'],
        ];

        foreach ($links as $i => $link) {
            SocialLink::create($link + ['logo_path' => '/images/placeholder-image.svg', 'sort_order' => $i + 1]);
        }
    }
}
```

- [ ] **Step 5: Register the seeder**

In `database/seeders/DatabaseSeeder.php`, add `SocialLinkSeeder::class` to the existing `$this->call([...])` array (alongside the 10 entries already there from phase 1 and Plan 1 — read the file first).

- [ ] **Step 6: Migrate, seed, and verify**

Run: `php artisan migrate:fresh --seed`

Then run: `php artisan tinker --execute="echo App\Models\SocialLink::count() . ' social links';"`

Expected: `3 social links`

- [ ] **Step 7: Commit**

```bash
git add public/images/placeholder-image.svg database/migrations database/seeders app/Models/SocialLink.php
git commit -m "feat: add SocialLink model, migration, and seeder"
```

---

## Task 10: Social Links admin resource

Ports `GC-Fitness-Rebrand/src/routes/admin/_authenticated/social-links/index.tsx`, `src/components/admin/social-links/{social-link-grid,social-link-form}.tsx`. Changes: no client-side fetch-on-mount (Inertia delivers `links` as a prop already) and no manual `refresh()` after a mutation (a Laravel `back()` redirect re-visits this same page, which Inertia re-renders with fresh props automatically); the form uses `@inertiajs/react`'s `useForm` (`post`/`put`) instead of `react-hook-form` + `zod` + the axios-based `socialLinksApi` — per this plan's Global Constraints, Inertia-native throughout. No unsaved-changes warning yet (Task 14 adds it to all 4 forms in one pass).

**Files:**
- Create: `app/Http/Controllers/Admin/SocialLinkController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Components/admin/SocialLinkGrid.jsx`
- Create: `resources/js/Components/admin/SocialLinkForm.jsx`
- Create: `resources/js/Pages/Admin/SocialLinks/Index.jsx`

**Interfaces:**
- Consumes: `SocialLink` model (Task 9); `ImageUpload` (Task 8); `Button`, `Input`, `Label` (phase 1/Plan 1); `Sheet`* (this plan's Task 1); `DeleteConfirmDialog` (Task 7); `AdminLayout` (Task 5).
- Produces: routes `admin.social-links.index` (GET `/admin/social-links`), `admin.social-links.store` (POST), `admin.social-links.update` (PUT `/admin/social-links/{socialLink}`), `admin.social-links.destroy` (DELETE) — all behind `auth.admin`. The `/admin/social-links` page.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/SocialLinkController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SocialLink;
use Illuminate\Http\Request;

class SocialLinkController extends Controller
{
    public function index()
    {
        return inertia('Admin/SocialLinks/Index', [
            'links' => SocialLink::orderBy('sort_order')->get(['id', 'platform', 'url', 'logo_path']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'platform' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url'],
            'logo_path' => ['required', 'string'],
        ]);

        $nextOrder = (int) SocialLink::max('sort_order') + 1;

        SocialLink::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, SocialLink $socialLink)
    {
        $validated = $request->validate([
            'platform' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url'],
            'logo_path' => ['required', 'string'],
        ]);

        $socialLink->update($validated);

        return back();
    }

    public function destroy(SocialLink $socialLink)
    {
        $socialLink->delete();

        return back();
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\SocialLinkController;` to the imports, and add these 4 lines inside the same `Route::middleware('auth.admin')->group(...)` block that already contains `dashboard`, `logout`, and `uploads` (Task 8):

```php
Route::get('social-links', [SocialLinkController::class, 'index'])->name('social-links.index');
Route::post('social-links', [SocialLinkController::class, 'store'])->name('social-links.store');
Route::put('social-links/{socialLink}', [SocialLinkController::class, 'update'])->name('social-links.update');
Route::delete('social-links/{socialLink}', [SocialLinkController::class, 'destroy'])->name('social-links.destroy');
```

Every admin content route in this plan (and every later phase-2 plan) shares that one group, per the Global Constraint that no admin route ever uses the stock `auth` alias.

- [ ] **Step 3: Port the grid component**

Create `resources/js/Components/admin/SocialLinkGrid.jsx`:

```jsx
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";

export function SocialLinkGrid({ links, onEdit, onDeleteRequest }) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {links.map((link) => (
                <div key={link.id} className="group relative rounded-lg border border-border bg-card p-4">
                    <img src={link.logo_path} alt={link.platform} className="mx-auto h-16 object-contain" />
                    <p className="mt-2 text-center text-sm font-medium">{link.platform}</p>
                    <p className="truncate text-center text-xs text-muted-foreground">{link.url}</p>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions for ${link.platform}`}
                                className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(link.id)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteRequest(link)} className="text-destructive">
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

Create `resources/js/Components/admin/SocialLinkForm.jsx`:

```jsx
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { ImageUpload } from "@/Components/admin/ImageUpload";

export function SocialLinkForm({ initialValues, onCancel, onSaved }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors } = useForm({
        platform: initialValues?.platform ?? "",
        url: initialValues?.url ?? "",
        logo_path: initialValues?.logo_path ?? "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/social-links/${initialValues.id}`, options);
        } else {
            post("/admin/social-links", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="logo_path">Logo</Label>
                <ImageUpload value={data.logo_path} onChange={(url) => setData("logo_path", url)} uploadType="social-link" />
                {errors.logo_path && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.logo_path}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input id="platform" value={data.platform} onChange={(e) => setData("platform", e.target.value)} />
                {errors.platform && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.platform}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" value={data.url} onChange={(e) => setData("url", e.target.value)} />
                {errors.url && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.url}
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

- [ ] **Step 5: Build the index page**

Create `resources/js/Pages/Admin/SocialLinks/Index.jsx`:

```jsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { SocialLinkForm } from "@/Components/admin/SocialLinkForm";
import { SocialLinkGrid } from "@/Components/admin/SocialLinkGrid";
import AdminLayout from "@/Layouts/AdminLayout";

function SocialLinksPage({ links }) {
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    function closeDrawer() {
        setEditing(null);
    }

    function handleSaved() {
        toast.success(editing === "new" ? "Social link created." : "Social link updated.");
        closeDrawer();
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/social-links/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Social link deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Social Links — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Social Links</h1>
                    <Button onClick={() => setEditing("new")}>Add social link</Button>
                </div>

                <SocialLinkGrid
                    links={links}
                    onEdit={(id) => setEditing(links.find((l) => l.id === id) ?? null)}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{editing === "new" ? "Add social link" : "Edit social link"}</SheetTitle>
                        </SheetHeader>
                        {editing !== null && (
                            <SocialLinkForm initialValues={editing === "new" ? null : editing} onCancel={closeDrawer} onSaved={handleSaved} />
                        )}
                    </SheetContent>
                </Sheet>

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.platform ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

SocialLinksPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SocialLinksPage;
```

- [ ] **Step 6: Verify**

Log in via the established curl pattern, then:
1. `GET /admin/social-links` — confirm HTTP 200, `"component":"Admin/SocialLinks/Index"`, `links` prop has the 3 seeded rows.
2. `POST /admin/social-links` with `platform=YouTube&url=https://youtube.com/gcfitness&logo_path=/images/placeholder-image.svg` (plus the XSRF header) — confirm redirect back, then re-fetch the index and confirm 4 links now.
3. `PUT /admin/social-links/{id}` (the one just created) changing `platform=YouTube Channel` — confirm the index reflects the change.
4. `DELETE /admin/social-links/{id}` (the same one) — confirm the index is back to 3 links.
5. `POST /admin/social-links` with an invalid `url` (e.g. `url=not-a-url`) — confirm a validation error redirect (not a 500), and that re-fetching the index shows `errors.url` populated in the Inertia payload.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Admin/SocialLinkController.php routes/web.php resources/js/Components/admin/SocialLinkGrid.jsx resources/js/Components/admin/SocialLinkForm.jsx resources/js/Pages/Admin/SocialLinks/Index.jsx
git commit -m "feat: add Social Links admin resource"
```

---

## Task 11: FAQ admin resource

Ports `GC-Fitness-Rebrand/src/routes/admin/_authenticated/faqs/index.tsx`, `src/components/admin/faqs/{faq-list,faq-form}.tsx`. Same Inertia-native adaptation as Task 10 (no client fetch/refresh, `useForm`'s `post`/`put` instead of react-hook-form+zod), plus this resource's own two extras from the source: a Tabs switch (Contact/Membership) filtering the list client-side, and a read-only "View" mode (View/Edit/Duplicate/Delete row menu) — the `Faq` model already exists from phase 1 (`fillable: question, answer, page, sort_order`).

**Files:**
- Create: `app/Http/Controllers/Admin/FaqController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Components/admin/FaqList.jsx`
- Create: `resources/js/Components/admin/FaqForm.jsx`
- Create: `resources/js/Pages/Admin/Faqs/Index.jsx`

**Interfaces:**
- Consumes: `App\Models\Faq` (phase 1); `Table`*, `Tabs`*, `Select`*, `Textarea` (this plan's Task 6); `Button`, `Input`, `Label` (Plan 1); `DropdownMenu`* (Task 3); `Sheet`* (Task 1); `DeleteConfirmDialog` (Task 7); `AdminLayout` (Task 5).
- Produces: routes `admin.faqs.index` (GET `/admin/faqs`), `admin.faqs.store` (POST), `admin.faqs.update` (PUT `/admin/faqs/{faq}`), `admin.faqs.destroy` (DELETE) — all behind `auth.admin`. The `/admin/faqs` page. "Duplicate" is not a distinct backend action — the page issues a plain `router.post` to the store route with the copied fields.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/FaqController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index()
    {
        return inertia('Admin/Faqs/Index', [
            'faqs' => Faq::orderBy('sort_order')->get(['id', 'question', 'answer', 'page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => ['required', 'string'],
            'answer' => ['required', 'string'],
            'page' => ['required', 'in:contact,membership'],
        ]);

        $nextOrder = (int) Faq::max('sort_order') + 1;

        Faq::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, Faq $faq)
    {
        $validated = $request->validate([
            'question' => ['required', 'string'],
            'answer' => ['required', 'string'],
            'page' => ['required', 'in:contact,membership'],
        ]);

        $faq->update($validated);

        return back();
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        return back();
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\FaqController;` to the imports, and inside the same `auth.admin` block used by Task 10's Social Links routes:

```php
Route::get('faqs', [FaqController::class, 'index'])->name('faqs.index');
Route::post('faqs', [FaqController::class, 'store'])->name('faqs.store');
Route::put('faqs/{faq}', [FaqController::class, 'update'])->name('faqs.update');
Route::delete('faqs/{faq}', [FaqController::class, 'destroy'])->name('faqs.destroy');
```

- [ ] **Step 3: Port the list component**

Create `resources/js/Components/admin/FaqList.jsx`:

```jsx
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export function FaqList({ faqs, onView, onEdit, onDuplicate, onDeleteRequest }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {faqs.map((faq) => (
                    <TableRow key={faq.id}>
                        <TableCell className="max-w-xs font-medium">{faq.question}</TableCell>
                        <TableCell className="max-w-md truncate">{faq.answer}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${faq.question}`}>
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onView(faq.id)}>View</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(faq.id)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(faq)}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteRequest(faq)} className="text-destructive">
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

Create `resources/js/Components/admin/FaqForm.jsx`:

```jsx
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Textarea } from "@/Components/ui/textarea";

export function FaqForm({ initialValues, defaultPage, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors } = useForm({
        question: initialValues?.question ?? "",
        answer: initialValues?.answer ?? "",
        page: initialValues?.page ?? defaultPage,
    });

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/faqs/${initialValues.id}`, options);
        } else {
            post("/admin/faqs", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input id="question" value={data.question} disabled={readOnly} onChange={(e) => setData("question", e.target.value)} />
                {errors.question && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.question}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea id="answer" rows={4} value={data.answer} disabled={readOnly} onChange={(e) => setData("answer", e.target.value)} />
                {errors.answer && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.answer}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="page">Show on</Label>
                <Select value={data.page} onValueChange={(value) => setData("page", value)} disabled={readOnly}>
                    <SelectTrigger id="page">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="membership">Membership</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                {readOnly ? (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Close
                    </Button>
                ) : (
                    <>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Saving…" : "Save"}
                        </Button>
                    </>
                )}
            </div>
        </form>
    );
}
```

- [ ] **Step 5: Build the index page**

Create `resources/js/Pages/Admin/Faqs/Index.jsx`:

```jsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { FaqForm } from "@/Components/admin/FaqForm";
import { FaqList } from "@/Components/admin/FaqList";
import AdminLayout from "@/Layouts/AdminLayout";

function FaqsPage({ faqs }) {
    const [activePage, setActivePage] = useState("contact");
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const visible = faqs.filter((f) => f.page === activePage);

    function closeDrawer() {
        setEditing(null);
        setViewing(null);
    }

    function handleDuplicate(faq) {
        router.post(
            "/admin/faqs",
            { question: `${faq.question} (Copy)`, answer: faq.answer, page: faq.page },
            {
                onSuccess: () => toast.success("FAQ created."),
                onError: () => toast.error("Something went wrong."),
            },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/faqs/${deleteTarget.id}`, {
            onSuccess: () => toast.success("FAQ deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    function handleSaved() {
        toast.success(editing === "new" ? "FAQ created." : "FAQ updated.");
        closeDrawer();
    }

    return (
        <>
            <Head title="FAQs — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">FAQs</h1>
                    <Button onClick={() => setEditing("new")}>Add FAQ</Button>
                </div>

                <Tabs value={activePage} onValueChange={setActivePage}>
                    <TabsList>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="membership">Membership</TabsTrigger>
                    </TabsList>
                </Tabs>

                <FaqList
                    faqs={visible}
                    onView={(id) => setViewing(faqs.find((f) => f.id === id) ?? null)}
                    onEdit={(id) => setEditing(faqs.find((f) => f.id === id) ?? null)}
                    onDuplicate={handleDuplicate}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null || viewing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{viewing !== null ? "View FAQ" : editing === "new" ? "Add FAQ" : "Edit FAQ"}</SheetTitle>
                        </SheetHeader>
                        {(editing !== null || viewing !== null) && (
                            <FaqForm
                                initialValues={viewing ?? (editing === "new" ? null : editing)}
                                defaultPage={activePage}
                                onCancel={closeDrawer}
                                onSaved={handleSaved}
                                readOnly={viewing !== null}
                            />
                        )}
                    </SheetContent>
                </Sheet>

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.question ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

FaqsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default FaqsPage;
```

- [ ] **Step 6: Verify**

Log in via the established curl pattern, then:
1. `GET /admin/faqs` — confirm HTTP 200, `"component":"Admin/Faqs/Index"`, `faqs` prop has the phase-1-seeded rows.
2. `POST /admin/faqs` with `question=Test?&answer=Test answer&page=contact` — confirm redirect back, then re-fetch and confirm the new row.
3. `PUT /admin/faqs/{id}` on that row changing `page=membership` — confirm the change.
4. `DELETE /admin/faqs/{id}` on that row — confirm it's gone.
5. `POST /admin/faqs` with `page=not-a-real-page` — confirm a validation error (not a 500).

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Admin/FaqController.php routes/web.php resources/js/Components/admin/FaqList.jsx resources/js/Components/admin/FaqForm.jsx resources/js/Pages/Admin/Faqs/Index.jsx
git commit -m "feat: add FAQ admin resource"
```

---

## Task 12: Testimonial admin resource

Ports `GC-Fitness-Rebrand/src/routes/admin/_authenticated/testimonials/index.tsx`, `src/components/admin/testimonials/{testimonial-list,testimonial-form}.tsx`. Structurally identical to Task 11 (Tabs by `page`, View/Edit/Duplicate/Delete row menu, Sheet drawer, `useForm` instead of react-hook-form+zod) with different fields and page values: `quote`/`name`/`role`/`page` (`home`|`about`) instead of `question`/`answer`/`page` (`contact`|`membership`). The `Testimonial` model already exists from phase 1 (`fillable: quote, name, role, page, sort_order`).

**Files:**
- Create: `app/Http/Controllers/Admin/TestimonialController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Components/admin/TestimonialList.jsx`
- Create: `resources/js/Components/admin/TestimonialForm.jsx`
- Create: `resources/js/Pages/Admin/Testimonials/Index.jsx`

**Interfaces:**
- Consumes: `App\Models\Testimonial` (phase 1); `Table`*, `Tabs`*, `Select`*, `Textarea` (Task 6); `Button`, `Input`, `Label` (Plan 1); `DropdownMenu`* (Task 3); `Sheet`* (Task 1); `DeleteConfirmDialog` (Task 7); `AdminLayout` (Task 5).
- Produces: routes `admin.testimonials.index` (GET `/admin/testimonials`), `admin.testimonials.store` (POST), `admin.testimonials.update` (PUT `/admin/testimonials/{testimonial}`), `admin.testimonials.destroy` (DELETE) — all behind `auth.admin`. The `/admin/testimonials` page.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/TestimonialController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use Illuminate\Http\Request;

class TestimonialController extends Controller
{
    public function index()
    {
        return inertia('Admin/Testimonials/Index', [
            'testimonials' => Testimonial::orderBy('sort_order')->get(['id', 'quote', 'name', 'role', 'page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'quote' => ['required', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'page' => ['required', 'in:home,about'],
        ]);

        $nextOrder = (int) Testimonial::max('sort_order') + 1;

        Testimonial::create($validated + ['sort_order' => $nextOrder]);

        return back();
    }

    public function update(Request $request, Testimonial $testimonial)
    {
        $validated = $request->validate([
            'quote' => ['required', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', 'string', 'max:255'],
            'page' => ['required', 'in:home,about'],
        ]);

        $testimonial->update($validated);

        return back();
    }

    public function destroy(Testimonial $testimonial)
    {
        $testimonial->delete();

        return back();
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\TestimonialController;` to the imports, and inside the same `auth.admin` block:

```php
Route::get('testimonials', [TestimonialController::class, 'index'])->name('testimonials.index');
Route::post('testimonials', [TestimonialController::class, 'store'])->name('testimonials.store');
Route::put('testimonials/{testimonial}', [TestimonialController::class, 'update'])->name('testimonials.update');
Route::delete('testimonials/{testimonial}', [TestimonialController::class, 'destroy'])->name('testimonials.destroy');
```

- [ ] **Step 3: Port the list component**

Create `resources/js/Components/admin/TestimonialList.jsx`:

```jsx
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/Components/ui/table";

export function TestimonialList({ testimonials, onView, onEdit, onDuplicate, onDeleteRequest }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Quote</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-10" />
                </TableRow>
            </TableHeader>
            <TableBody>
                {testimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                        <TableCell className="max-w-md truncate">{testimonial.quote}</TableCell>
                        <TableCell className="font-medium">{testimonial.name}</TableCell>
                        <TableCell>{testimonial.role}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label={`Actions for ${testimonial.name}`}>
                                        <MoreHorizontal className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onView(testimonial.id)}>View</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(testimonial.id)}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(testimonial)}>Duplicate</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDeleteRequest(testimonial)} className="text-destructive">
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

Create `resources/js/Components/admin/TestimonialForm.jsx`:

```jsx
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Textarea } from "@/Components/ui/textarea";

export function TestimonialForm({ initialValues, defaultPage, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors } = useForm({
        quote: initialValues?.quote ?? "",
        name: initialValues?.name ?? "",
        role: initialValues?.role ?? "",
        page: initialValues?.page ?? defaultPage,
    });

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/testimonials/${initialValues.id}`, options);
        } else {
            post("/admin/testimonials", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="quote">Quote</Label>
                <Textarea id="quote" rows={4} value={data.quote} disabled={readOnly} onChange={(e) => setData("quote", e.target.value)} />
                {errors.quote && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.quote}
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

            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={data.role} disabled={readOnly} onChange={(e) => setData("role", e.target.value)} />
                {errors.role && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.role}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="page">Show on</Label>
                <Select value={data.page} onValueChange={(value) => setData("page", value)} disabled={readOnly}>
                    <SelectTrigger id="page">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="about">About</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                {readOnly ? (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Close
                    </Button>
                ) : (
                    <>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Saving…" : "Save"}
                        </Button>
                    </>
                )}
            </div>
        </form>
    );
}
```

- [ ] **Step 5: Build the index page**

Create `resources/js/Pages/Admin/Testimonials/Index.jsx`:

```jsx
import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { TestimonialForm } from "@/Components/admin/TestimonialForm";
import { TestimonialList } from "@/Components/admin/TestimonialList";
import AdminLayout from "@/Layouts/AdminLayout";

function TestimonialsPage({ testimonials }) {
    const [activePage, setActivePage] = useState("home");
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const visible = testimonials.filter((t) => t.page === activePage);

    function closeDrawer() {
        setEditing(null);
        setViewing(null);
    }

    function handleDuplicate(testimonial) {
        router.post(
            "/admin/testimonials",
            { quote: testimonial.quote, name: `${testimonial.name} (Copy)`, role: testimonial.role, page: testimonial.page },
            {
                onSuccess: () => toast.success("Testimonial created."),
                onError: () => toast.error("Something went wrong."),
            },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/testimonials/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Testimonial deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    function handleSaved() {
        toast.success(editing === "new" ? "Testimonial created." : "Testimonial updated.");
        closeDrawer();
    }

    return (
        <>
            <Head title="Testimonials — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Testimonials</h1>
                    <Button onClick={() => setEditing("new")}>Add testimonial</Button>
                </div>

                <Tabs value={activePage} onValueChange={setActivePage}>
                    <TabsList>
                        <TabsTrigger value="home">Home</TabsTrigger>
                        <TabsTrigger value="about">About</TabsTrigger>
                    </TabsList>
                </Tabs>

                <TestimonialList
                    testimonials={visible}
                    onView={(id) => setViewing(testimonials.find((t) => t.id === id) ?? null)}
                    onEdit={(id) => setEditing(testimonials.find((t) => t.id === id) ?? null)}
                    onDuplicate={handleDuplicate}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null || viewing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{viewing !== null ? "View testimonial" : editing === "new" ? "Add testimonial" : "Edit testimonial"}</SheetTitle>
                        </SheetHeader>
                        {(editing !== null || viewing !== null) && (
                            <TestimonialForm
                                initialValues={viewing ?? (editing === "new" ? null : editing)}
                                defaultPage={activePage}
                                onCancel={closeDrawer}
                                onSaved={handleSaved}
                                readOnly={viewing !== null}
                            />
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

TestimonialsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default TestimonialsPage;
```

- [ ] **Step 6: Verify**

Same pattern as Task 11 Step 6, against `/admin/testimonials` with `quote`/`name`/`role`/`page` (`home`|`about`) fields — index fetch, create, update, delete, and one invalid-`page` validation check.

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Admin/TestimonialController.php routes/web.php resources/js/Components/admin/TestimonialList.jsx resources/js/Components/admin/TestimonialForm.jsx resources/js/Pages/Admin/Testimonials/Index.jsx
git commit -m "feat: add Testimonial admin resource"
```

---

## Task 13: Site Settings admin resource

Ports `GC-Fitness-Rebrand/src/routes/admin/_authenticated/site-settings/index.tsx` and `src/components/admin/site-settings/site-settings-form.tsx`. Adapted in two ways: Inertia-native (`useForm`'s `put`, no react-hook-form+zod, no client fetch/loading/error state — the singleton row is a normal Inertia prop), and the field set matches this project's actual `SiteSetting` schema (`address_line1`, `address_line2`, `phone`, `email`, `hours` — 5 required string columns, per the migration) rather than the source's single `address` field. No list, no create, no delete — one form bound to one row.

**Files:**
- Create: `app/Http/Controllers/Admin/SiteSettingController.php`
- Modify: `routes/web.php`
- Create: `resources/js/Pages/Admin/SiteSettings/Edit.jsx`

**Interfaces:**
- Consumes: `App\Models\SiteSetting` (phase 1, `fillable: address_line1, address_line2, phone, email, hours`); `Button`, `Input`, `Label` (Plan 1); `AdminLayout` (Task 5).
- Produces: routes `admin.site-settings.edit` (GET `/admin/site-settings`), `admin.site-settings.update` (PUT `/admin/site-settings`) — behind `auth.admin`. The `/admin/site-settings` page.

- [ ] **Step 1: Create the controller**

Create `app/Http/Controllers/Admin/SiteSettingController.php`:

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
    public function edit()
    {
        $settings = SiteSetting::first() ?? new SiteSetting();

        return inertia('Admin/SiteSettings/Edit', [
            'settings' => [
                'address_line1' => $settings->address_line1,
                'address_line2' => $settings->address_line2,
                'phone' => $settings->phone,
                'email' => $settings->email,
                'hours' => $settings->hours,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'hours' => ['required', 'string', 'max:255'],
        ]);

        $settings = SiteSetting::first() ?? new SiteSetting();
        $settings->fill($validated);
        $settings->save();

        return back();
    }
}
```

- [ ] **Step 2: Add the routes**

In `routes/web.php`, add `use App\Http\Controllers\Admin\SiteSettingController;` to the imports, and inside the same `auth.admin` block:

```php
Route::get('site-settings', [SiteSettingController::class, 'edit'])->name('site-settings.edit');
Route::put('site-settings', [SiteSettingController::class, 'update'])->name('site-settings.update');
```

- [ ] **Step 3: Build the page**

Create `resources/js/Pages/Admin/SiteSettings/Edit.jsx`:

```jsx
import { Head, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import AdminLayout from "@/Layouts/AdminLayout";

function SiteSettingsPage({ settings }) {
    const { data, setData, put, processing, errors } = useForm({
        address_line1: settings.address_line1 ?? "",
        address_line2: settings.address_line2 ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
        hours: settings.hours ?? "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        put("/admin/site-settings", {
            onSuccess: () => toast.success("Site Settings updated."),
            onError: () => toast.error("Something went wrong."),
        });
    }

    return (
        <>
            <Head title="Site Settings — GCFitness Admin" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Site Settings</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Powers the Contact page's info block from one source.</p>
                </div>
                <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address_line1">Address line 1</Label>
                        <Input id="address_line1" value={data.address_line1} onChange={(e) => setData("address_line1", e.target.value)} />
                        {errors.address_line1 && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.address_line1}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address_line2">Address line 2</Label>
                        <Input id="address_line2" value={data.address_line2} onChange={(e) => setData("address_line2", e.target.value)} />
                        {errors.address_line2 && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.address_line2}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={data.phone} onChange={(e) => setData("phone", e.target.value)} />
                        {errors.phone && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.phone}
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

                    <div className="space-y-2">
                        <Label htmlFor="hours">Hours</Label>
                        <Input id="hours" value={data.hours} onChange={(e) => setData("hours", e.target.value)} />
                        {errors.hours && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.hours}
                            </p>
                        )}
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing ? "Saving…" : "Save"}
                    </Button>
                </form>
            </div>
        </>
    );
}

SiteSettingsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SiteSettingsPage;
```

- [ ] **Step 4: Verify**

Log in via the established curl pattern, then:
1. `GET /admin/site-settings` — confirm HTTP 200, `"component":"Admin/SiteSettings/Edit"`, `settings` prop matches phase 1's seeded row.
2. `PUT /admin/site-settings` with all 5 fields (e.g. changing `phone`) — confirm redirect back, then re-fetch and confirm the change persisted.
3. `PUT /admin/site-settings` with `email=not-an-email` — confirm a validation error (not a 500).
4. Confirm phase 1's `ContactController` (which reads `SiteSetting::first() ?? new SiteSetting()`) still renders the public Contact page correctly after this update — the two share the same row.

- [ ] **Step 5: Commit**

```bash
git add app/Http/Controllers/Admin/SiteSettingController.php routes/web.php resources/js/Pages/Admin/SiteSettings/Edit.jsx
git commit -m "feat: add Site Settings admin resource"
```

---

## Task 14: Unsaved-changes guard and full regression pass

Ports `GC-Fitness-Rebrand/src/components/admin/shared/unsaved-changes-guard.tsx`, adapted from TanStack Router's `useBlocker` (in-app navigation) + a `beforeunload` listener (tab close/refresh) to Inertia's global `router.on("before", …)` event (which fires before every Inertia visit and cancels it if the callback returns `false`) for the in-app case, keeping the same `beforeunload` listener for the tab-close/refresh case. Wired into all 3 CRUD forms (`SocialLinkForm`, `FaqForm`, `TestimonialForm`) and the `SiteSettings` page's inline form, each via the `isDirty` flag Inertia's own `useForm` already tracks — no extra dirty-tracking code needed.

**Files:**
- Create: `resources/js/hooks/useUnsavedChangesGuard.js`
- Modify: `resources/js/Components/admin/SocialLinkForm.jsx`
- Modify: `resources/js/Components/admin/FaqForm.jsx`
- Modify: `resources/js/Components/admin/TestimonialForm.jsx`
- Modify: `resources/js/Pages/Admin/SiteSettings/Edit.jsx`

**Interfaces:**
- Consumes: `@inertiajs/react`'s `router` (global singleton, already used throughout this plan) and each form's own `useForm().isDirty`.
- Produces: `useUnsavedChangesGuard(isDirty: boolean): void` — a hook with no return value, called once near the top of each form component.

- [ ] **Step 1: Create the hook**

Create `resources/js/hooks/useUnsavedChangesGuard.js`:

```js
import { router } from "@inertiajs/react";
import { useEffect } from "react";

export function useUnsavedChangesGuard(isDirty) {
    useEffect(() => {
        if (!isDirty) return;

        function handleBeforeUnload(event) {
            event.preventDefault();
            event.returnValue = "";
        }

        window.addEventListener("beforeunload", handleBeforeUnload);

        const removeInertiaListener = router.on("before", () => {
            return window.confirm("You have unsaved changes. Leave without saving?");
        });

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            removeInertiaListener();
        };
    }, [isDirty]);
}
```

- [ ] **Step 2: Wire into SocialLinkForm**

In `resources/js/Components/admin/SocialLinkForm.jsx`, add the import and call the hook right after the `useForm` destructure:

```jsx
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
```

```jsx
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        platform: initialValues?.platform ?? "",
        url: initialValues?.url ?? "",
        logo_path: initialValues?.logo_path ?? "",
    });

    useUnsavedChangesGuard(isDirty);
```

- [ ] **Step 3: Wire into FaqForm (read-only aware)**

In `resources/js/Components/admin/FaqForm.jsx`, add the same import, and call the hook forcing `false` while `readOnly` (a disabled form can never become dirty, matching the source's read-only addendum):

```jsx
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
```

```jsx
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        question: initialValues?.question ?? "",
        answer: initialValues?.answer ?? "",
        page: initialValues?.page ?? defaultPage,
    });

    useUnsavedChangesGuard(readOnly ? false : isDirty);
```

- [ ] **Step 4: Wire into TestimonialForm (read-only aware)**

In `resources/js/Components/admin/TestimonialForm.jsx`, the same change as Step 3, adapted to its own field names:

```jsx
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
```

```jsx
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        quote: initialValues?.quote ?? "",
        name: initialValues?.name ?? "",
        role: initialValues?.role ?? "",
        page: initialValues?.page ?? defaultPage,
    });

    useUnsavedChangesGuard(readOnly ? false : isDirty);
```

- [ ] **Step 5: Wire into the Site Settings page**

In `resources/js/Pages/Admin/SiteSettings/Edit.jsx`, add the same import and call:

```jsx
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
```

```jsx
    const { data, setData, put, processing, errors, isDirty } = useForm({
        address_line1: settings.address_line1 ?? "",
        address_line2: settings.address_line2 ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
        hours: settings.hours ?? "",
    });

    useUnsavedChangesGuard(isDirty);
```

- [ ] **Step 6: Full manual regression pass**

Log in via the established curl-based session pattern (or a real browser session if available), then walk through every resource this plan built:

1. **AdminShell**: sidebar renders both nav groups (Content: Testimonials, FAQs; Site Info: Site Settings, Social Links) with correct active-link highlighting on each page; breadcrumbs match the current route; the account menu opens and "Log out" ends the session (subsequent requests to any `/admin/*` page redirect to `admin.login`).
2. **Social Links**: create (with an uploaded image via `ImageUpload`), edit, delete — grid reflects each change without a manual refresh.
3. **FAQs**: create, edit, duplicate, delete, and the View drawer (read-only, no Save button) on both the Contact and Membership tabs.
4. **Testimonials**: same 5 checks as FAQs, on the Home and About tabs.
5. **Site Settings**: edit and save; confirm the public `/contact` page (phase 1) reflects the change.
6. **Unsaved-changes guard**: start editing any one form (don't save), attempt to navigate to a different admin page via the sidebar — confirm a confirmation prompt appears and canceling it keeps the edit in place.
7. Confirm no console errors and no broken image icons anywhere in the admin area.

Record the outcome of each check in the task report; do not mark this task complete until all pass.

- [ ] **Step 7: Commit**

```bash
git add resources/js/hooks/useUnsavedChangesGuard.js resources/js/Components/admin/SocialLinkForm.jsx resources/js/Components/admin/FaqForm.jsx resources/js/Components/admin/TestimonialForm.jsx resources/js/Pages/Admin/SiteSettings/Edit.jsx
git commit -m "feat: add unsaved-changes guard to all Plan 2 forms"
```
