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
