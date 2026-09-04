import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { SocialLinkForm } from "@/Components/admin/SocialLinkForm";
import { SocialLinkGrid } from "@/Components/admin/SocialLinkGrid";
import AdminLayout from "@/Layouts/AdminLayout";

function SocialLinksPage({ links }) {
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    function closeDrawer() {
        setEditing(null);
    }

    function handleSaved() {
        toast.success(editing === "new" ? "Social link created." : "Social link updated.");
        closeDrawer();
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/social-links/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Social link deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Social Links — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Social Links</h1>
                    <Button onClick={() => setEditing("new")}>Add social link</Button>
                </div>

                <SocialLinkGrid
                    links={links}
                    onEdit={(id) => setEditing(links.find((l) => l.id === id) ?? null)}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{editing === "new" ? "Add social link" : "Edit social link"}</SheetTitle>
                        </SheetHeader>
                        {editing !== null && (
                            <SocialLinkForm initialValues={editing === "new" ? null : editing} onCancel={closeDrawer} onSaved={handleSaved} />
                        )}
                    </SheetContent>
                </Sheet>

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.platform ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

SocialLinksPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SocialLinksPage;
