import { usePage } from "@inertiajs/react";

function getGreetingWord(hour) {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

export function DashboardGreeting() {
    const { auth } = usePage().props;
    const name = auth?.user?.name ?? "Admin";
    const greetingWord = getGreetingWord(new Date().getHours());

    return (
        <h1 className="text-2xl font-semibold">
            {greetingWord}, {name}
        </h1>
    );
}
