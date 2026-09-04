import { Linkedin } from "lucide-react";
import {
    siInstagram,
    siFacebook,
    siTiktok,
    siYoutube,
    siX,
    siThreads,
    siPinterest,
    siSnapchat,
    siWhatsapp,
    siTelegram,
    siDiscord,
    siReddit,
    siTumblr,
    siWechat,
    siLine,
    siViber,
    siSignal,
    siMessenger,
    siTwitch,
    siVimeo,
    siRumble,
    siSpotify,
    siSoundcloud,
    siApplemusic,
    siBandcamp,
    siDeezer,
    siPatreon,
    siSubstack,
    siMedium,
    siGoogle,
    siYelp,
    siTripadvisor,
    siBluesky,
    siMastodon,
    siStrava,
    siGarmin,
} from "simple-icons";

// A curated, fitness-brand-relevant subset of simple-icons' ~3,200-brand
// catalog, statically imported so the bundler only ships these icons'
// path data (tens of KB) instead of the full 5MB+ catalog. LinkedIn has no
// simple-icons entry (removed from their catalog over brand-guideline
// disputes), so it's special-cased via lucide-react's own Linkedin icon.
// Adding a new platform is a two-line change: one import above, one entry
// in SIMPLE_ICONS below.
const SIMPLE_ICONS = [
    siInstagram,
    siFacebook,
    siTiktok,
    siYoutube,
    siX,
    siThreads,
    siPinterest,
    siSnapchat,
    siWhatsapp,
    siTelegram,
    siDiscord,
    siReddit,
    siTumblr,
    siWechat,
    siLine,
    siViber,
    siSignal,
    siMessenger,
    siTwitch,
    siVimeo,
    siRumble,
    siSpotify,
    siSoundcloud,
    siApplemusic,
    siBandcamp,
    siDeezer,
    siPatreon,
    siSubstack,
    siMedium,
    siGoogle,
    siYelp,
    siTripadvisor,
    siBluesky,
    siMastodon,
    siStrava,
    siGarmin,
];

export const BRAND_ICONS = Object.fromEntries([
    ...SIMPLE_ICONS.map((icon) => [icon.slug, { slug: icon.slug, title: icon.title, path: icon.path }]),
    ["linkedin", { slug: "linkedin", title: "LinkedIn", Component: Linkedin }],
]);

export const BRAND_ICON_LIST = Object.values(BRAND_ICONS).sort((a, b) => a.title.localeCompare(b.title));
