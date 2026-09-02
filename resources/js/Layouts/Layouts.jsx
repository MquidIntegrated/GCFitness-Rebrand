import { useEffect, useState } from "react";
import { ThemeProvider } from "@/Components/ThemeProvider";
import { Preloader } from "@/Components/Preloader";
import { RouteLoader } from "@/Components/RouteLoader";
import { SiteNav } from "@/Components/SiteNav";
import { SiteFooter } from "@/Components/SiteFooter";
import { ScrollToTop } from "@/Components/ScrollToTop";

export default function SiteLayout({ children }) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <ThemeProvider>
            <Preloader />
            <RouteLoader />
            <SiteNav scrolled={scrolled} />
            <main className="min-h-screen">{children}</main>
            <SiteFooter />
            <ScrollToTop />
        </ThemeProvider>
    );
}
