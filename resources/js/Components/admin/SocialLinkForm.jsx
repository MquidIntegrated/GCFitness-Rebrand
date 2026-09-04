import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { ImageUpload } from "@/Components/admin/ImageUpload";

export function SocialLinkForm({ initialValues, onCancel, onSaved }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors } = useForm({
        platform: initialValues?.platform ?? "",
        url: initialValues?.url ?? "",
        logo_path: initialValues?.logo_path ?? "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/social-links/${initialValues.id}`, options);
        } else {
            post("/admin/social-links", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="logo_path">Logo</Label>
                <ImageUpload value={data.logo_path} onChange={(url) => setData("logo_path", url)} uploadType="social-link" />
                {errors.logo_path && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.logo_path}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input id="platform" value={data.platform} onChange={(e) => setData("platform", e.target.value)} />
                {errors.platform && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.platform}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" value={data.url} onChange={(e) => setData("url", e.target.value)} />
                {errors.url && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.url}
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
    );
}
