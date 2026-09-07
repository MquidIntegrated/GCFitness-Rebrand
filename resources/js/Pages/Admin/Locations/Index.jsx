import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { LocationForm } from "@/Components/admin/LocationForm";
import { LocationList } from "@/Components/admin/LocationList";
import AdminLayout from "@/Layouts/AdminLayout";

function LocationsPage({ locations }) {
    const [editing, setEditing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    function closeDrawer() {
        setEditing(null);
    }

    function handleSaved() {
        toast.success(editing === "new" ? "Location created." : "Location updated.");
        closeDrawer();
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/locations/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Location deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Club Locations — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Club Locations</h1>
                    <Button onClick={() => setEditing("new")}>Add location</Button>
                </div>

                <LocationList
                    locations={locations}
                    onEdit={(id) => setEditing(locations.find((l) => l.id === id) ?? null)}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{editing === "new" ? "Add location" : "Edit location"}</SheetTitle>
                        </SheetHeader>
                        {editing !== null && (
                            <LocationForm initialValues={editing === "new" ? null : editing} onCancel={closeDrawer} onSaved={handleSaved} />
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

LocationsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default LocationsPage;
