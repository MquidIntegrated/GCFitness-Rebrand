import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function ScrollToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Scroll back to top"
            className={`fixed bottom-8 right-6 z-40 grid size-12 place-items-center rounded-full border border-brand/30 bg-brand/10 text-foreground shadow-elevated backdrop-blur-md transition-all duration-300 hover:border-brand/60 hover:bg-brand hover:text-white md:bottom-10 md:right-10 ${
                visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
            }`}
        >
            <ArrowUp className="size-5" />
        </button>
    );
}
