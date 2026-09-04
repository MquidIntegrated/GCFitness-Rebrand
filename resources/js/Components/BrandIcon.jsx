import { Link2 } from "lucide-react";
import { BRAND_ICONS } from "@/lib/brandIcons";

export function BrandIcon({ slug, className = "size-4" }) {
    const icon = BRAND_ICONS[slug];

    if (!icon) {
        return <Link2 className={className} aria-hidden="true" />;
    }

    if (icon.Component) {
        const Icon = icon.Component;
        return <Icon className={className} aria-hidden="true" />;
    }

    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
            <path d={icon.path} />
        </svg>
    );
}
