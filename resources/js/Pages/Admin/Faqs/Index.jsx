import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { FaqForm } from "@/Components/admin/FaqForm";
import { FaqList } from "@/Components/admin/FaqList";
import AdminLayout from "@/Layouts/AdminLayout";

function FaqsPage({ faqs }) {
    const [activePage, setActivePage] = useState("contact");
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const visible = faqs.filter((f) => f.page === activePage);

    function closeDrawer() {
        setEditing(null);
        setViewing(null);
    }

    function handleDuplicate(faq) {
        router.post(
            "/admin/faqs",
            { question: `${faq.question} (Copy)`, answer: faq.answer, page: faq.page },
            {
                onSuccess: () => toast.success("FAQ created."),
                onError: () => toast.error("Something went wrong."),
            },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/faqs/${deleteTarget.id}`, {
            onSuccess: () => toast.success("FAQ deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    function handleSaved() {
        toast.success(editing === "new" ? "FAQ created." : "FAQ updated.");
        closeDrawer();
    }

    return (
        <>
            <Head title="FAQs — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">FAQs</h1>
                    <Button onClick={() => setEditing("new")}>Add FAQ</Button>
                </div>

                <Tabs value={activePage} onValueChange={setActivePage}>
                    <TabsList>
                        <TabsTrigger value="contact">Contact</TabsTrigger>
                        <TabsTrigger value="membership">Membership</TabsTrigger>
                    </TabsList>
                </Tabs>

                <FaqList
                    faqs={visible}
                    onView={(id) => setViewing(faqs.find((f) => f.id === id) ?? null)}
                    onEdit={(id) => setEditing(faqs.find((f) => f.id === id) ?? null)}
                    onDuplicate={handleDuplicate}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null || viewing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{viewing !== null ? "View FAQ" : editing === "new" ? "Add FAQ" : "Edit FAQ"}</SheetTitle>
                        </SheetHeader>
                        {(editing !== null || viewing !== null) && (
                            <FaqForm
                                initialValues={viewing ?? (editing === "new" ? null : editing)}
                                defaultPage={activePage}
                                onCancel={closeDrawer}
                                onSaved={handleSaved}
                                readOnly={viewing !== null}
                            />
                        )}
                    </SheetContent>
                </Sheet>

                <DeleteConfirmDialog
                    open={deleteTarget !== null}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                    itemLabel={deleteTarget?.question ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

FaqsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default FaqsPage;
