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
