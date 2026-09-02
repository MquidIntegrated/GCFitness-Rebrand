import { useId, useState } from "react";

export function FaqItem({ q, a }) {
    const [open, setOpen] = useState(false);
    const panelId = useId();

    return (
        <div className={`rounded-2xl border border-border p-6 transition-colors duration-300 ${open ? "bg-card/80" : "bg-card"}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
            >
                <span className="font-display text-lg uppercase">{q}</span>
                <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full border border-border text-brand transition-transform duration-300 ${
                        open ? "rotate-45" : ""
                    }`}
                >
                    +
                </span>
            </button>
            <div
                id={panelId}
                className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <p className="overflow-hidden pt-4 text-sm text-muted-foreground">{a}</p>
            </div>
        </div>
    );
}
