import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function LocationForm({ initialValues, onCancel, onSaved }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        name: initialValues?.name ?? "",
        address: initialValues?.address ?? "",
        hours: initialValues?.hours ?? "",
    });

    const unsavedChangesDialog = useUnsavedChangesGuard(isDirty);

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/locations/${initialValues.id}`, options);
        } else {
            post("/admin/locations", options);
        }
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={data.address} onChange={(e) => setData("address", e.target.value)} />
                {errors.address && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.address}
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

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? "Saving…" : "Save"}
                </Button>
            </div>
        </form>
        {unsavedChangesDialog}
        </>
    );
}
