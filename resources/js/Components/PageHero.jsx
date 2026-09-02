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
