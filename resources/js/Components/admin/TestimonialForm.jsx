import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function TestimonialForm({ initialValues, defaultPage, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        quote: initialValues?.quote ?? "",
        name: initialValues?.name ?? "",
        role: initialValues?.role ?? "",
        show_on_home: initialValues?.show_on_home ?? defaultPage === "home",
        show_on_about: initialValues?.show_on_about ?? defaultPage === "about",
    });

    const unsavedChangesDialog = useUnsavedChangesGuard(readOnly ? false : isDirty);

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/testimonials/${initialValues.id}`, options);
        } else {
            post("/admin/testimonials", options);
        }
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="quote">Quote</Label>
                <Textarea id="quote" rows={4} value={data.quote} disabled={readOnly} onChange={(e) => setData("quote", e.target.value)} />
                {errors.quote && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.quote}
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

            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={data.role} disabled={readOnly} onChange={(e) => setData("role", e.target.value)} />
                {errors.role && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.role}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label>Show on</Label>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="show_on_home"
                            checked={data.show_on_home}
                            disabled={readOnly}
                            onCheckedChange={(checked) => setData("show_on_home", checked === true)}
                        />
                        <Label htmlFor="show_on_home" className="font-normal">
                            Home
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="show_on_about"
                            checked={data.show_on_about}
                            disabled={readOnly}
                            onCheckedChange={(checked) => setData("show_on_about", checked === true)}
                        />
                        <Label htmlFor="show_on_about" className="font-normal">
                            About
                        </Label>
                    </div>
                </div>
                {errors.show_on_home && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.show_on_home}
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                {readOnly ? (
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Close
                    </Button>
                ) : (
                    <>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Saving…" : "Save"}
                        </Button>
                    </>
                )}
            </div>
        </form>
        {unsavedChangesDialog}
        </>
    );
}
