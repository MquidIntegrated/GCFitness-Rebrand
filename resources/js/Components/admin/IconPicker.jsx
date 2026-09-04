import { useMemo, useState } from "react";
import { Input } from "@/Components/ui/input";
import { BrandIcon } from "@/Components/BrandIcon";
import { BRAND_ICON_LIST } from "@/lib/brandIcons";
import { cn } from "@/lib/utils";

export function IconPicker({ value, onChange, disabled = false }) {
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return BRAND_ICON_LIST;
        return BRAND_ICON_LIST.filter((icon) => icon.title.toLowerCase().includes(q) || icon.slug.includes(q));
    }, [query]);

    const selected = BRAND_ICON_LIST.find((icon) => icon.slug === value);

    return (
        <div className="space-y-2">
            <Input
                type="text"
                placeholder="Search platforms…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={disabled}
            />
            <div className="grid max-h-48 grid-cols-6 gap-2 overflow-y-auto rounded-md border border-input p-2 sm:grid-cols-8">
                {filtered.map((icon) => (
                    <button
                        key={icon.slug}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(icon.slug)}
                        title={icon.title}
                        aria-label={icon.title}
                        aria-pressed={icon.slug === value}
                        className={cn(
                            "flex aspect-square items-center justify-center rounded-md border text-foreground transition hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-50",
                            icon.slug === value ? "border-brand bg-brand/10 text-brand" : "border-transparent",
                        )}
                    >
                        <BrandIcon slug={icon.slug} className="size-5" />
                    </button>
                ))}
                {filtered.length === 0 && (
                    <p className="col-span-full py-4 text-center text-sm text-muted-foreground">No matching platform</p>
                )}
            </div>
            {selected && <p className="text-sm text-muted-foreground">Selected: {selected.title}</p>}
        </div>
    );
}
