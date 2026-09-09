import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { ImageUpload } from "@/Components/admin/ImageUpload";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function PartnerForm({ initialValues, onCancel, onSaved }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        name: initialValues?.name ?? "",
        logo_path: initialValues?.logo_path ?? "",
    });
    const [uploadingImage, setUploadingImage] = useState(false);

    useUnsavedChangesGuard(isDirty);

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/partners/${initialValues.id}`, options);
        } else {
            post("/admin/partners", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="logo_path">Logo</Label>
                <ImageUpload
                    id="logo_path"
                    value={data.logo_path}
                    onChange={(url) => setData("logo_path", url)}
                    uploadType="partner"
                    onUploadingChange={setUploadingImage}
                />
                {errors.logo_path && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.logo_path}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing || uploadingImage}>
                    {processing ? "Saving…" : "Save"}
                </Button>
            </div>
        </form>
    );
}
