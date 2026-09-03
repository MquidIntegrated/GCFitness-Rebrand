import { Head, Link } from "@inertiajs/react";
import { Check, ArrowRight, Snowflake, Flame, Droplet, HeartPulse } from "lucide-react";
import { useState } from "react";

import heroImg from "@/assets/hero-membership.jpg";
import recoveryImg from "@/assets/membership-recovery.jpg";
import { PageHero } from "@/Components/PageHero";
import { Reveal } from "@/Components/Reveal";
import { FaqItem } from "@/Components/FaqItem";
import { GYM_MASTER_URL } from "@/lib/external-links";

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
