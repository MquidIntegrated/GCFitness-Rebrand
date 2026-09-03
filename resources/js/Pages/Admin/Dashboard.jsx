import { Head, useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";

function DashboardPage() {
    const { post, processing } = useForm();

    function handleLogout(e) {
        e.preventDefault();
        post("/admin/logout");
    }

    return (
        <>
            <Head title="Dashboard — GCFitness Admin" />
            <div className="flex min-h-screen items-center justify-center bg-background px-6">
                <div className="w-full max-w-sm text-center">
                    <h1 className="text-2xl font-semibold">Welcome back</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Signed in successfully. The full dashboard (stats, activity, charts) and the
                        rest of the admin CMS are built in later phase-2 plans.
                    </p>
                    <form onSubmit={handleLogout} className="mt-6">
                        <Button type="submit" disabled={processing}>
                            {processing ? "Signing out…" : "Sign out"}
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}

DashboardPage.layout = (page) => page;

export default DashboardPage;
