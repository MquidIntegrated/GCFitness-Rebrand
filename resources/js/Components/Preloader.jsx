import { useEffect, useState } from "react";

export function Preloader() {
    const [hidden, setHidden] = useState(false);
    const [gone, setGone] = useState(false);

    useEffect(() => {
        document.documentElement.classList.add("preload-lock");
        const t1 = window.setTimeout(() => {
            setHidden(true);
            document.documentElement.classList.remove("preload-lock");
        }, 900);
        const t2 = window.setTimeout(() => setGone(true), 1500);
        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
            document.documentElement.classList.remove("preload-lock");
        };
    }, []);

    if (gone) return null;

    return (
        <div
            aria-hidden
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
                hidden ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
        >
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/30 blur-3xl" />
            <div className="relative flex flex-col items-center">
                <div className="font-hero text-5xl tracking-widest text-foreground md:text-6xl">
                    GC<span className="text-brand">Fitness</span>
                </div>
                <div className="mt-6 h-[2px] w-40 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 rounded-full bg-brand animate-preloader-bar" />
                </div>
                <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
                    Performance loading
                </div>
            </div>
        </div>
    );
}
