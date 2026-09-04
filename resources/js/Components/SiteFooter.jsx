import { Link, usePage } from "@inertiajs/react";
import { Instagram, Youtube, Twitter, MapPin, Phone, Mail } from "lucide-react";

export function SiteFooter() {
    const { siteSetting = {} } = usePage().props;

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
                                <span>{siteSetting.address_line1}<br />{siteSetting.address_line2}</span>
                            </li>
                            <li className="flex gap-3">
                                <Phone className="mt-0.5 size-4 shrink-0 text-brand" />
                                <span>{siteSetting.phone}</span>
                            </li>
                            <li className="flex gap-3">
                                <Mail className="mt-0.5 size-4 shrink-0 text-brand" />
                                <span>{siteSetting.email}</span>
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
