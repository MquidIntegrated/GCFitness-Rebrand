import { Dumbbell, Users, CreditCard, Handshake, MapPin, MessageSquareQuote, HelpCircle } from "lucide-react";
import { StatCard } from "@/Components/admin/StatCard";

const COUNT_META = {
    programs: { label: "Programs", icon: Dumbbell },
    trainers: { label: "Trainers", icon: Users },
    membershipPlans: { label: "Membership Plans", icon: CreditCard },
    partners: { label: "Trusted Partners", icon: Handshake },
    locations: { label: "Club Locations", icon: MapPin },
    testimonials: { label: "Testimonials", icon: MessageSquareQuote },
    faqs: { label: "FAQs", icon: HelpCircle },
};

export function DashboardOverviewCards({ counts }) {
    // Filters out any key COUNT_META doesn't recognize instead of crashing —
    // the two lists are independent (this one needs icons, a frontend-only
    // concern) so a future 8th tracked resource landing here before this
    // map is updated should degrade gracefully, not white-screen the page.
    const countKeys = Object.keys(counts).filter((key) => COUNT_META[key]);

    return (
        <div className="flex flex-wrap justify-center gap-4">
            {countKeys.map((key) => (
                <StatCard
                    key={key}
                    label={COUNT_META[key].label}
                    value={counts[key]}
                    icon={COUNT_META[key].icon}
                    className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
                />
            ))}
        </div>
    );
}
