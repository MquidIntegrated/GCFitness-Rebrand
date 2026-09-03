import { Head } from "@inertiajs/react";
import { MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import heroImg from "@/assets/hero-contact.jpg";
import { PageHero } from "@/Components/PageHero";
import { Reveal } from "@/Components/Reveal";
import { FaqItem } from "@/Components/FaqItem";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xaqrkzag";

export default function Contact({ clubs, faqs, siteSetting = {} }) {
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
