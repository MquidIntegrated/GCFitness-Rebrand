import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

export function RouteLoader() {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const stopStart = router.on("start", () => setIsLoading(true));
        const stopFinish = router.on("finish", () => setIsLoading(false));
        return () => {
            stopStart();
            stopFinish();
        };
    }, []);

    return (
        <div
            aria-hidden
            className={`pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden transition-opacity duration-300 ${
                isLoading ? "opacity-100" : "opacity-0"
            }`}
        >
            <div className="absolute inset-0 bg-border/40" />
            {isLoading && (
                <div className="absolute inset-y-0 left-0 w-1/3 animate-route-roller rounded-full bg-brand shadow-brand" />
            )}
        </div>
    );
}
