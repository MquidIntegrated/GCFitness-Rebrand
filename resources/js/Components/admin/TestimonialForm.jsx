import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Textarea } from "@/Components/ui/textarea";

export function TestimonialForm({ initialValues, defaultPage, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors } = useForm({
        quote: initialValues?.quote ?? "",
        name: initialValues?.name ?? "",
        role: initialValues?.role ?? "",
        page: initialValues?.page ?? defaultPage,
    });

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
                <Label htmlFor="page">Show on</Label>
                <Select value={data.page} onValueChange={(value) => setData("page", value)} disabled={readOnly}>
                    <SelectTrigger id="page">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="about">About</SelectItem>
                    </SelectContent>
                </Select>
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
    );
}
