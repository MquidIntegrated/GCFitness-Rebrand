import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { ProgramList } from "@/Components/admin/ProgramList";
import AdminLayout from "@/Layouts/AdminLayout";

function ProgramsPage({ programs }) {
    const [deleteTarget, setDeleteTarget] = useState(null);

    function handleDuplicate(program) {
        router.post(
            "/admin/programs",
            {
                title: `${program.title} (Copy)`,
                tag: program.tag,
                duration: program.duration,
                level: program.level,
                description: program.description,
                home_description: program.home_description,
                image_path: program.image_path,
                featured: program.featured,
            },
            {
                onSuccess: () => toast.success("Program created."),
                onError: () => toast.error("Something went wrong."),
            },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/programs/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Program deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    return (
        <>
            <Head title="Programs — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Programs</h1>
                    <Button asChild>
                        <Link href="/admin/programs/create">Add program</Link>
                    </Button>
                </div>

                <ProgramList programs={programs} onDuplicate={handleDuplicate} onDeleteRequest={setDeleteTarget} />

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.title ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

ProgramsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ProgramsPage;
