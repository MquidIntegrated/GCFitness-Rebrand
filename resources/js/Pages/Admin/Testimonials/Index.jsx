import { Head, router } from "@inertiajs/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/Components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { DeleteConfirmDialog } from "@/Components/admin/DeleteConfirmDialog";
import { TestimonialForm } from "@/Components/admin/TestimonialForm";
import { TestimonialList } from "@/Components/admin/TestimonialList";
import AdminLayout from "@/Layouts/AdminLayout";

function TestimonialsPage({ testimonials }) {
    const [activePage, setActivePage] = useState("home");
    const [editing, setEditing] = useState(null);
    const [viewing, setViewing] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const visible = testimonials.filter((t) => (activePage === "home" ? t.show_on_home : t.show_on_about));

    function closeDrawer() {
        setEditing(null);
        setViewing(null);
    }

    function handleDuplicate(testimonial) {
        router.post(
            "/admin/testimonials",
            {
                quote: testimonial.quote,
                name: `${testimonial.name} (Copy)`,
                role: testimonial.role,
                show_on_home: testimonial.show_on_home,
                show_on_about: testimonial.show_on_about,
            },
            {
                onSuccess: () => toast.success("Testimonial created."),
                onError: () => toast.error("Something went wrong."),
            },
        );
    }

    function handleConfirmDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/testimonials/${deleteTarget.id}`, {
            onSuccess: () => toast.success("Testimonial deleted."),
            onError: () => toast.error("Something went wrong."),
            onFinish: () => setDeleteTarget(null),
        });
    }

    function handleSaved() {
        toast.success(editing === "new" ? "Testimonial created." : "Testimonial updated.");
        closeDrawer();
    }

    return (
        <>
            <Head title="Testimonials — GCFitness Admin" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Testimonials</h1>
                    <Button onClick={() => setEditing("new")}>Add testimonial</Button>
                </div>

                <Tabs value={activePage} onValueChange={setActivePage}>
                    <TabsList>
                        <TabsTrigger value="home">Home</TabsTrigger>
                        <TabsTrigger value="about">About</TabsTrigger>
                    </TabsList>
                </Tabs>

                <TestimonialList
                    testimonials={visible}
                    onView={(id) => setViewing(testimonials.find((t) => t.id === id) ?? null)}
                    onEdit={(id) => setEditing(testimonials.find((t) => t.id === id) ?? null)}
                    onDuplicate={handleDuplicate}
                    onDeleteRequest={setDeleteTarget}
                />

                <Sheet open={editing !== null || viewing !== null} onOpenChange={(open) => !open && closeDrawer()}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>{viewing !== null ? "View testimonial" : editing === "new" ? "Add testimonial" : "Edit testimonial"}</SheetTitle>
                        </SheetHeader>
                        {(editing !== null || viewing !== null) && (
                            <TestimonialForm
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
                    itemLabel={deleteTarget?.name ?? ""}
                    onConfirm={handleConfirmDelete}
                />
            </div>
        </>
    );
}

TestimonialsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default TestimonialsPage;
