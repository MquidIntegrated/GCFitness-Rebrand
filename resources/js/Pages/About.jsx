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
