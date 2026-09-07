import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { TrainerList } from "@/Components/admin/TrainerList";
import AdminLayout from "@/Layouts/AdminLayout";

function TrainersPage({ trainers }) {
    const [deleteTarget, setDeleteTarget] = useState(null);

    function handleDuplicate(trainer) {
        router.post(
            "/admin/trainers",
            {
                name: `${trainer.name} (Copy)`,
                specialty: trainer.specialty,
                years_experience: trainer.years_experience,
                bio: trainer.bio,
                certifications: trainer.certifications,
                image_path: trainer.image_path,
            },
            {
                onSuccess: () => toast.success("Trainer created."),
                onError: () => toast.error("Something went wrong."),
            },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/trainers/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Trainer deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Trainers — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Trainers</h1>
                    <Button asChild>
                        <Link href="/admin/trainers/create">Add trainer</Link>
                    </Button>
                </div>

                <TrainerList trainers={trainers} onDuplicate={handleDuplicate} onDeleteRequest={setDeleteTarget} />

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

TrainersPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default TrainersPage;
