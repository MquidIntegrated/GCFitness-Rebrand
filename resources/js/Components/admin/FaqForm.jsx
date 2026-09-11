import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function FaqForm({ initialValues, defaultPage, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty } = useForm({
        question: initialValues?.question ?? "",
        answer: initialValues?.answer ?? "",
        show_on_contact: initialValues?.show_on_contact ?? defaultPage === "contact",
        show_on_membership: initialValues?.show_on_membership ?? defaultPage === "membership",
    });

    const unsavedChangesDialog = useUnsavedChangesGuard(readOnly ? false : isDirty);

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/faqs/${initialValues.id}`, options);
        } else {
            post("/admin/faqs", options);
        }
    }

    return (
        <>
        <form onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Input id="question" value={data.question} disabled={readOnly} onChange={(e) => setData("question", e.target.value)} />
                {errors.question && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.question}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="answer">Answer</Label>
                <Textarea id="answer" rows={4} value={data.answer} disabled={readOnly} onChange={(e) => setData("answer", e.target.value)} />
                {errors.answer && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.answer}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label>Show on</Label>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="show_on_contact"
                            checked={data.show_on_contact}
                            disabled={readOnly}
                            onCheckedChange={(checked) => setData("show_on_contact", checked === true)}
                        />
                        <Label htmlFor="show_on_contact" className="font-normal">
                            Contact
                        </Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="show_on_membership"
                            checked={data.show_on_membership}
                            disabled={readOnly}
                            onCheckedChange={(checked) => setData("show_on_membership", checked === true)}
                        />
                        <Label htmlFor="show_on_membership" className="font-normal">
                            Membership
                        </Label>
                    </div>
                </div>
                {errors.show_on_contact && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.show_on_contact}
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
