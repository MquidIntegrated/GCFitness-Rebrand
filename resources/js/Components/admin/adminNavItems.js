import { MessageSquareQuote, HelpCircle, Settings, Share2 } from "lucide-react";

export const CONTENT_NAV_ITEMS = [
    { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { to: "/admin/faqs", label: "FAQs", icon: HelpCircle },
];

export const SITE_INFO_NAV_ITEMS = [
    { to: "/admin/site-settings", label: "Site Settings", icon: Settings },
    { to: "/admin/social-links", label: "Social Links", icon: Share2 },
];
