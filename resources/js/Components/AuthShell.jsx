export function AuthShell({ children }) {
    return (
        <div className="flex min-h-screen">
            <div className="relative hidden w-[40%] shrink-0 items-center justify-center overflow-hidden bg-brand lg:flex">
                <div className="pointer-events-none absolute inset-0 bg-grid opacity-20" />
                <div className="relative text-center">
                    <div className="font-hero text-4xl uppercase tracking-widest text-white">
                        GC<span className="text-white/70">Fitness</span>
                    </div>
                    <p className="mt-3 text-sm text-white/80">Content Studio</p>
                </div>
            </div>
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">{children}</div>
            </div>
        </div>
    );
}
