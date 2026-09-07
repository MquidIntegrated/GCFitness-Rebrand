import { lazy, Suspense } from "react";
import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { DashboardGreeting } from "@/Components/admin/DashboardGreeting";
import { DashboardOverviewCards } from "@/Components/admin/DashboardOverviewCards";
import { DashboardRecentActivityList } from "@/Components/admin/DashboardRecentActivityList";
import { Skeleton } from "@/Components/ui/skeleton";

const DashboardActivityChart = lazy(() =>
    import("@/Components/admin/DashboardActivityChart").then((module) => ({
        default: module.DashboardActivityChart,
    })),
);

function DashboardPage({ counts, recentActivity, activityByDay }) {
    return (
        <>
            <Head title="Dashboard — GCFitness Admin" />
            <div className="space-y-8">
                <DashboardGreeting />
                <DashboardOverviewCards counts={counts} />
                <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <DashboardActivityChart data={activityByDay} />
                </Suspense>
                <DashboardRecentActivityList activity={recentActivity} />
            </div>
        </>
    );
}

DashboardPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default DashboardPage;
