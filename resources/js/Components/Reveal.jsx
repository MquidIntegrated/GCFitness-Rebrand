import { useEffect, useRef, useState } from "react";

export function Reveal({ children, delay = 0, as: Tag = "div", className = "" }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        setVisible(true);
                        obs.disconnect();
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
        );
        obs.observe(node);
        return () => obs.disconnect();
    }, []);

    const style = { transitionDelay: `${delay}ms` };
    const Component = Tag;

    return (
        <Component ref={ref} style={style} className={`reveal ${visible ? "is-visible" : ""} ${className}`}>
            {children}
        </Component>
    );
}
