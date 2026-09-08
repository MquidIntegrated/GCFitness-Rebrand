import { Dumbbell, Users, CreditCard, MessageSquareQuote, HelpCircle, MapPin, Handshake, Settings, Share2, ShieldCheck } from "lucide-react";

export const CONTENT_NAV_ITEMS = [
    { to: "/admin/programs", label: "Programs", icon: Dumbbell },
    { to: "/admin/trainers", label: "Trainers", icon: Users },
    { to: "/admin/membership-plans", label: "Membership Plans", icon: CreditCard },
    { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
];

export const SITE_INFO_NAV_ITEMS = [
    { to: "/admin/locations", label: "Club Locations", icon: MapPin },
    { to: "/admin/partners", label: "Trusted Partners", icon: Handshake },
    { to: "/admin/site-settings", label: "Site Settings", icon: Settings },
    { to: "/admin/social-links", label: "Social Links", icon: Share2 },
];

export const SUPER_ADMIN_NAV_ITEMS = [
    { to: "/admin/admins", label: "Manage Admins", icon: ShieldCheck },
];
