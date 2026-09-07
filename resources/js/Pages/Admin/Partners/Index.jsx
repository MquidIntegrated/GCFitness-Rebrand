import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { PartnerForm } from "@/Components/admin/PartnerForm";
import { PartnerGrid } from "@/Components/admin/PartnerGrid";
import AdminLayout from "@/Layouts/AdminLayout";

function PartnersPage({ partners }) {
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    function closeDrawer() {
        setEditing(null);
    }

    function handleSaved() {
        toast.success(editing === "new" ? "Partner created." : "Partner updated.");
        closeDrawer();
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/partners/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Partner deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Trusted Partners — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Trusted Partners</h1>
                    <Button onClick={() => setEditing("new")}>Add partner</Button>
                </div>

                <PartnerGrid
                    partners={partners}
                    onEdit={(id) => setEditing(partners.find((p) => p.id === id) ?? null)}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{editing === "new" ? "Add partner" : "Edit partner"}</SheetTitle>
                        </SheetHeader>
                        {editing !== null && (
                            <PartnerForm initialValues={editing === "new" ? null : editing} onCancel={closeDrawer} onSaved={handleSaved} />
                        )}
                    </SheetContent>
                </Sheet>

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

PartnersPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default PartnersPage;
