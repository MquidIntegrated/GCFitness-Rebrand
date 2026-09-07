import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import { ProgramForm } from "@/Components/admin/ProgramForm";
import AdminLayout from "@/Layouts/AdminLayout";

function ProgramFormPage({ program, readOnly }) {
    const isCreating = program === null;

    function goBack() {
        router.visit("/admin/programs");
    }

    function handleSaved() {
        toast.success(isCreating ? "Program created." : "Program updated.");
    }

    return (
        <>
            <Head title={`${readOnly ? "View" : isCreating ? "Add" : "Edit"} program — GCFitness Admin`} />
            <div className="space-y-6">
                <h1 className="text-2xl font-semibold">{readOnly ? "View program" : isCreating ? "Add program" : "Edit program"}</h1>
                <ProgramForm initialValues={program} onCancel={goBack} onSaved={handleSaved} readOnly={readOnly} />
            </div>
        </>
    );
}

ProgramFormPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ProgramFormPage;
