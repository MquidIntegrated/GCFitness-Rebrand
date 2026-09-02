import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
    theme: "dark",
    toggle: () => {},
    setTheme: () => {},
});

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("gcfitness-theme");
            const initial =
                stored ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
            setTheme(initial);
        } catch {
            /* noop */
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        root.classList.remove("dark", "light");
        root.classList.add(theme);
        try {
            localStorage.setItem("gcfitness-theme", theme);
        } catch {
            /* noop */
        }
    }, [theme, mounted]);

    const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

    return (
        <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
