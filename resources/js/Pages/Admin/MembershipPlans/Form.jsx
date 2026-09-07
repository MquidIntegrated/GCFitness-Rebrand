import { Head, router } from "@inertiajs/react";
import { toast } from "sonner";
import { MembershipPlanForm } from "@/Components/admin/MembershipPlanForm";
import AdminLayout from "@/Layouts/AdminLayout";

function MembershipPlanFormPage({ plan }) {
    const isCreating = plan === null;

    function goBack() {
        router.visit("/admin/membership-plans");
    }

    function handleSaved() {
        toast.success(isCreating ? "Membership plan created." : "Membership plan updated.");
    }

    return (
        <>
            <Head title={`${isCreating ? "Add" : "Edit"} plan — GCFitness Admin`} />
            <div className="space-y-6">
                <h1 className="text-2xl font-semibold">{isCreating ? "Add plan" : "Edit plan"}</h1>
                <MembershipPlanForm initialValues={plan} onCancel={goBack} onSaved={handleSaved} />
            </div>
        </>
    );
}

MembershipPlanFormPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default MembershipPlanFormPage;
