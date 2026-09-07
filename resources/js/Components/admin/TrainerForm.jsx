import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { ImageUpload } from "@/Components/admin/ImageUpload";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function TrainerForm({ initialValues, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty, transform } = useForm({
        name: initialValues?.name ?? "",
        specialty: initialValues?.specialty ?? "",
        years_experience: initialValues?.years_experience ?? "",
        bio: initialValues?.bio ?? "",
        certifications: initialValues?.certifications?.join(", ") ?? "",
        image_path: initialValues?.image_path ?? "",
    });
    const [uploadingImage, setUploadingImage] = useState(false);

    useUnsavedChangesGuard(readOnly ? false : isDirty);

    transform((formData) => ({
        ...formData,
        certifications: formData.certifications
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
    }));

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/trainers/${initialValues.id}`, options);
        } else {
            post("/admin/trainers", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
            <div className="space-y-2">
                <Label htmlFor="image_path">Image</Label>
                <ImageUpload
                    value={data.image_path}
                    onChange={(url) => setData("image_path", url)}
                    uploadType="trainer"
                    disabled={readOnly}
                    onUploadingChange={setUploadingImage}
                />
                {errors.image_path && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.image_path}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} disabled={readOnly} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Input id="specialty" value={data.specialty} disabled={readOnly} onChange={(e) => setData("specialty", e.target.value)} />
                    {errors.specialty && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.specialty}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="years_experience">Years of experience</Label>
                    <Input
                        id="years_experience"
                        value={data.years_experience}
                        disabled={readOnly}
                        onChange={(e) => setData("years_experience", e.target.value)}
                    />
                    {errors.years_experience && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.years_experience}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={4} value={data.bio} disabled={readOnly} onChange={(e) => setData("bio", e.target.value)} />
                {errors.bio && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.bio}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="certifications">Certifications</Label>
                <Input
                    id="certifications"
                    placeholder="CSCS, NASM-CPT"
                    value={data.certifications}
                    disabled={readOnly}
                    onChange={(e) => setData("certifications", e.target.value)}
                />
                {errors.certifications && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.certifications}
                    </p>
                )}
            </div>

            <div className="fixed inset-x-0 bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4">
                {readOnly ? (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Back
                    </Button>
                ) : (
                    <>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing || uploadingImage}>
                            {processing ? "Saving…" : "Save"}
                        </Button>
                    </>
                )}
            </div>
        </form>
    );
}
