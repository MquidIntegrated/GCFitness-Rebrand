import { Head } from "@inertiajs/react";

const STATUS_MESSAGES = {
    403: "You don't have permission to access this page.",
    404: "The page you're looking for doesn't exist.",
    419: "This page expired, please try again.",
    429: "Too many requests. Please slow down and try again shortly.",
    500: "Something went wrong on our end.",
    503: "The site is temporarily unavailable. Please check back soon.",
};

export default function Error({ status }) {
    const message = STATUS_MESSAGES[status] ?? "An unexpected error occurred.";

    return (
        <>
            <Head title={`${status} — GCFitness`} />
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
                <h1 className="text-6xl font-bold text-brand">{status}</h1>
                <p className="text-lg text-muted-foreground">{message}</p>
                <a href="/" className="text-sm font-medium text-primary hover:underline">
                    Go back home
                </a>
            </div>
        </>
    );
}
