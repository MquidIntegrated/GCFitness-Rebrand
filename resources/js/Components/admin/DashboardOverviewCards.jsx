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
    const countKeys = Object.keys(counts);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {countKeys.map((key) => (
                <StatCard key={key} label={COUNT_META[key].label} value={counts[key]} icon={COUNT_META[key].icon} />
            ))}
        </div>
    );
}
