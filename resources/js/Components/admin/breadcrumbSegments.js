import { CONTENT_NAV_ITEMS, SITE_INFO_NAV_ITEMS } from "./adminNavItems";

const DASHBOARD_PATH = "/admin/dashboard";
const DASHBOARD_LABEL = "Dashboard";

const ALL_NAV_ITEMS = [...CONTENT_NAV_ITEMS, ...SITE_INFO_NAV_ITEMS];

export function getBreadcrumbSegments(pathname, search) {
    if (pathname === DASHBOARD_PATH) {
        return [{ label: DASHBOARD_LABEL, to: DASHBOARD_PATH }];
    }

    const segments = [{ label: DASHBOARD_LABEL, to: DASHBOARD_PATH }];

    const matchedNavItem = ALL_NAV_ITEMS.find((item) => pathname.startsWith(item.to));

    if (!matchedNavItem) {
        return segments;
    }

    segments.push({ label: matchedNavItem.label, to: matchedNavItem.to });

    const remainder = pathname.slice(matchedNavItem.to.length).replace(/^\/+|\/+$/g, "");

    if (remainder.length > 0) {
        const lastPathSegment = remainder.split("/").pop();

        let label;
        if (lastPathSegment === "create") {
            label = "Add";
        } else if (search.mode === "view") {
            label = "View";
        } else {
            label = "Edit";
        }

        segments.push({ label });
    }

    return segments;
}
