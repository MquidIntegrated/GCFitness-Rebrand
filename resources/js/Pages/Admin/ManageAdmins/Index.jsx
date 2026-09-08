import { Head, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { AdminAccountForm } from "@/Components/admin/AdminAccountForm";
import { AdminAccountList } from "@/Components/admin/AdminAccountList";
import { TempPasswordDialog } from "@/Components/admin/TempPasswordDialog";
import AdminLayout from "@/Layouts/AdminLayout";

function ManageAdminsPage({ admins }) {
    const { flash } = usePage().props;
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [tempPassword, setTempPassword] = useState(null);

    useEffect(() => {
        if (flash?.tempPassword) {
            setTempPassword(flash.tempPassword);
        }
    }, [flash?.tempPassword]);

    function handleResetAccess(admin) {
        router.post(`/admin/admins/${admin.id}/reset-access`);
    }

    function handleDeactivate(admin) {
        router.post(
            `/admin/admins/${admin.id}/deactivate`,
            {},
            { onSuccess: () => toast.success(`${admin.name} deactivated.`) },
        );
    }

    function handleReactivate(admin) {
        router.post(
            `/admin/admins/${admin.id}/reactivate`,
            {},
            { onSuccess: () => toast.success(`${admin.name} reactivated.`) },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/admins/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Admin removed."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Manage Admins — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Manage Admins</h1>
                    <Button onClick={() => setCreating(true)}>Add admin</Button>
                </div>

                <AdminAccountList
                    admins={admins}
                    onResetAccess={handleResetAccess}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={creating} onOpenChange={setCreating}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Add admin</SheetTitle>
                        </SheetHeader>
                        <AdminAccountForm onCancel={() => setCreating(false)} onSaved={() => setCreating(false)} />
                    </SheetContent>
                </Sheet>

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.name ?? ""}
                    onConfirm={handleConfirmDelete}
                />

                <TempPasswordDialog password={tempPassword} onOpenChange={(open) => !open && setTempPassword(null)} />
            </div>
        </>
    );
}

ManageAdminsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ManageAdminsPage;
