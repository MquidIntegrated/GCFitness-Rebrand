import { Head, useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import AdminLayout from "@/Layouts/AdminLayout";

function SiteSettingsPage({ settings }) {
    const { data, setData, put, processing, errors } = useForm({
        address_line1: settings.address_line1 ?? "",
        address_line2: settings.address_line2 ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
        hours: settings.hours ?? "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        put("/admin/site-settings", {
            onSuccess: () => toast.success("Site Settings updated."),
            onError: () => toast.error("Something went wrong."),
        });
    }

    return (
        <>
            <Head title="Site Settings — GCFitness Admin" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Site Settings</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Powers the Contact page's info block from one source.</p>
                </div>
                <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="address_line1">Address line 1</Label>
                        <Input id="address_line1" value={data.address_line1} onChange={(e) => setData("address_line1", e.target.value)} />
                        {errors.address_line1 && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.address_line1}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address_line2">Address line 2</Label>
                        <Input id="address_line2" value={data.address_line2} onChange={(e) => setData("address_line2", e.target.value)} />
                        {errors.address_line2 && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.address_line2}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={data.phone} onChange={(e) => setData("phone", e.target.value)} />
                        {errors.phone && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.phone}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} />
                        {errors.email && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hours">Hours</Label>
                        <Input id="hours" value={data.hours} onChange={(e) => setData("hours", e.target.value)} />
                        {errors.hours && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.hours}
                            </p>
                        )}
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing ? "Saving…" : "Save"}
                    </Button>
                </form>
            </div>
        </>
    );
}

SiteSettingsPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default SiteSettingsPage;
