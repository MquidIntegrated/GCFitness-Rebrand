import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { MembershipPlanList } from "@/Components/admin/MembershipPlanList";
import AdminLayout from "@/Layouts/AdminLayout";

function MembershipPlansPage({ plans }) {
    const [deleteTarget, setDeleteTarget] = useState(null);

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/membership-plans/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Membership plan deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    function handleReorder(orderedIds) {
        router.patch(
            "/admin/membership-plans/reorder",
            { ids: orderedIds },
            {
                preserveScroll: true,
                onError: () => toast.error("Something went wrong."),
            },
        );
    }

    return (
        <>
            <Head title="Membership Plans — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Membership Plans</h1>
                    <Button asChild>
                        <Link href="/admin/membership-plans/create">Add plan</Link>
                    </Button>
                </div>

                <MembershipPlanList plans={plans} onDeleteRequest={setDeleteTarget} onReorder={handleReorder} />

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.name ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

MembershipPlansPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default MembershipPlansPage;
