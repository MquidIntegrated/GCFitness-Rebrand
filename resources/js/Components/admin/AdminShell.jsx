import { Fragment } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { LayoutDashboard, Sun, Moon, LogOut, ExternalLink } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/Components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Components/ui/dropdown-menu";
import { Separator } from "@/Components/ui/separator";
import { Toaster } from "@/Components/ui/sonner";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import { useTheme } from "@/Components/ThemeProvider";
import { CONTENT_NAV_ITEMS, SITE_INFO_NAV_ITEMS, SUPER_ADMIN_NAV_ITEMS } from "./adminNavItems";
import { getBreadcrumbSegments } from "./breadcrumbSegments";

export function AdminShell({ children }) {
    const { url, props } = usePage();
    const [pathname, search] = url.split("?");
    const searchParams = Object.fromEntries(new URLSearchParams(search ?? ""));
    const breadcrumbSegments = getBreadcrumbSegments(pathname, searchParams);
    const { theme, toggle } = useTheme();
    const adminName = props.auth?.user?.name ?? "Admin";

    function handleLogout() {
        router.post("/admin/logout");
    }

    return (
        <SidebarProvider>
            <Sidebar collapsible="icon">
                <SidebarHeader>
                    <div className="flex items-center gap-2 px-2 py-1">
                        <span className="font-hero text-lg uppercase tracking-widest text-brand">GC</span>
                        <span className="text-sm font-medium text-muted-foreground">Fitness CMS</span>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={pathname === "/admin/dashboard"}>
                                        <Link href="/admin/dashboard">
                                            <LayoutDashboard />
                                            <span>Dashboard</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarGroup>
                        <SidebarGroupLabel>Content</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {CONTENT_NAV_ITEMS.map((item) => (
                                    <SidebarMenuItem key={item.to}>
                                        <SidebarMenuButton asChild isActive={pathname.startsWith(item.to)}>
                                            <Link href={item.to}>
                                                <item.icon />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <SidebarGroup>
                        <SidebarGroupLabel>Site info</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {SITE_INFO_NAV_ITEMS.map((item) => (
                                    <SidebarMenuItem key={item.to}>
                                        <SidebarMenuButton asChild isActive={pathname.startsWith(item.to)}>
                                            <Link href={item.to}>
                                                <item.icon />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {props.auth?.user?.role === "super_admin" && (
                        <SidebarGroup>
                            <SidebarGroupLabel>Administration</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {SUPER_ADMIN_NAV_ITEMS.map((item) => (
                                        <SidebarMenuItem key={item.to}>
                                            <SidebarMenuButton asChild isActive={pathname.startsWith(item.to)}>
                                                <Link href={item.to}>
                                                    <item.icon />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )}
                </SidebarContent>

                <SidebarFooter>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton>
                                <span className="flex size-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                                    {adminName.charAt(0).toUpperCase()}
                                </span>
                                <span>{adminName}</span>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start" className="w-56">
                            <DropdownMenuItem onClick={handleLogout}>
                                <LogOut className="mr-2 size-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex h-14 items-center justify-between border-b border-border px-4">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger />
                        <Separator orientation="vertical" className="h-5" />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbSegments.map((segment, index) => {
                                    const isLastSegment = index === breadcrumbSegments.length - 1;
                                    return (
                                        <Fragment key={`${segment.label}-${index}`}>
                                            <BreadcrumbItem>
                                                {isLastSegment ? (
                                                    <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink asChild>
                                                        <Link href={segment.to}>{segment.label}</Link>
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {!isLastSegment && <BreadcrumbSeparator />}
                                        </Fragment>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href="/"
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            View live site
                            <ExternalLink className="size-3.5" />
                        </a>
                        <Separator orientation="vertical" className="h-5" />
                        <button
                            onClick={toggle}
                            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                        </button>
                    </div>
                </header>
                <main className="flex-1 p-6">{children}</main>
            </SidebarInset>
            <Toaster />
        </SidebarProvider>
    );
}
