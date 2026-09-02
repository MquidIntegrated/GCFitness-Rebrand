export function CutoutImage({ src, alt, className = "", size = "max-w-2xl md:max-w-4xl" }) {
    return (
        <div className={`relative overflow-visible ${className}`}>
            <div className="pointer-events-none absolute inset-x-8 bottom-2 h-1/3 rounded-full bg-foreground/10 blur-3xl" />
            <div className="relative z-10 animate-float-slow">
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    className={`mx-auto w-full ${size} scale-100 object-contain grayscale drop-shadow-[0_55px_55px_rgba(0,0,0,0.4)] md:scale-110`}
                />
            </div>
        </div>
    );
}
