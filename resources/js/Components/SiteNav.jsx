import { Link, usePage } from "@inertiajs/react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { GYM_MASTER_URL } from "@/lib/external-links";
import { useTheme } from "./ThemeProvider";

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
