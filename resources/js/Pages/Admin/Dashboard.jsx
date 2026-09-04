import { Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";

function DashboardPage() {
    return (
        <>
            <Head title="Dashboard — GCFitness Admin" />
            <div>
                <h1 className="text-2xl font-semibold">Welcome back</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    The full dashboard (stats, activity, charts) is built in a later phase-2 plan.
                </p>
            </div>
        </>
    );
}

DashboardPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default DashboardPage;
