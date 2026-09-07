import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import { TrainerForm } from "@/Components/admin/TrainerForm";
import AdminLayout from "@/Layouts/AdminLayout";

function TrainerFormPage({ trainer, readOnly }) {
    const isCreating = trainer === null;

    function goBack() {
        router.visit("/admin/trainers");
    }

    function handleSaved() {
        toast.success(isCreating ? "Trainer created." : "Trainer updated.");
    }

    return (
        <>
            <Head title={`${readOnly ? "View" : isCreating ? "Add" : "Edit"} trainer — GCFitness Admin`} />
            <div className="space-y-6">
                <h1 className="text-2xl font-semibold">{readOnly ? "View trainer" : isCreating ? "Add trainer" : "Edit trainer"}</h1>
                <TrainerForm initialValues={trainer} onCancel={goBack} onSaved={handleSaved} readOnly={readOnly} />
            </div>
        </>
    );
}

TrainerFormPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default TrainerFormPage;
