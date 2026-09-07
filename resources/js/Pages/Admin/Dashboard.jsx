import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { DashboardGreeting } from "@/Components/admin/DashboardGreeting";
import { DashboardOverviewCards } from "@/Components/admin/DashboardOverviewCards";
import { DashboardActivityChart } from "@/Components/admin/DashboardActivityChart";
import { DashboardRecentActivityList } from "@/Components/admin/DashboardRecentActivityList";

function DashboardPage({ counts, recentActivity, activityByDay }) {
    return (
        <>
            <Head title="Dashboard — GCFitness Admin" />
            <div className="space-y-8">
                <DashboardGreeting />
                <DashboardOverviewCards counts={counts} />
                <DashboardActivityChart data={activityByDay} />
                <DashboardRecentActivityList activity={recentActivity} />
            </div>
        </>
    );
}

DashboardPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default DashboardPage;
