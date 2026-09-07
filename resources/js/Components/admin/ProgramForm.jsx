import { useState } from "react";
import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { Textarea } from "@/Components/ui/textarea";
import { ImageUpload } from "@/Components/admin/ImageUpload";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function ProgramForm({ initialValues, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        title: initialValues?.title ?? "",
        tag: initialValues?.tag ?? "",
        duration: initialValues?.duration ?? "",
        level: initialValues?.level ?? "",
        description: initialValues?.description ?? "",
        home_description: initialValues?.home_description ?? "",
        image_path: initialValues?.image_path ?? "",
        featured: initialValues?.featured ?? false,
    });
    const [uploadingImage, setUploadingImage] = useState(false);

    useUnsavedChangesGuard(readOnly ? false : isDirty);

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/programs/${initialValues.id}`, options);
        } else {
            post("/admin/programs", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
            <div className="space-y-2">
                <Label htmlFor="image_path">Image</Label>
                <ImageUpload
                    value={data.image_path}
                    onChange={(url) => setData("image_path", url)}
                    uploadType="program"
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
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={data.title} disabled={readOnly} onChange={(e) => setData("title", e.target.value)} />
                {errors.title && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.title}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="tag">Tag</Label>
                    <Input id="tag" value={data.tag} disabled={readOnly} onChange={(e) => setData("tag", e.target.value)} />
                    {errors.tag && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.tag}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input id="duration" value={data.duration} disabled={readOnly} onChange={(e) => setData("duration", e.target.value)} />
                    {errors.duration && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.duration}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Input id="level" value={data.level} disabled={readOnly} onChange={(e) => setData("level", e.target.value)} />
                    {errors.level && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.level}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    rows={4}
                    value={data.description}
                    disabled={readOnly}
                    onChange={(e) => setData("description", e.target.value)}
                />
                {errors.description && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.description}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="home_description">Home page preview description</Label>
                <Textarea
                    id="home_description"
                    rows={2}
                    value={data.home_description}
                    disabled={readOnly}
                    onChange={(e) => setData("home_description", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">A shorter version shown on the Home page's program preview card.</p>
                {errors.home_description && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.home_description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Switch
                    id="featured"
                    checked={data.featured}
                    onCheckedChange={(checked) => setData("featured", checked)}
                    disabled={readOnly}
                />
                <Label htmlFor="featured">Featured on the public site</Label>
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
