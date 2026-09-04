import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Textarea } from "@/Components/ui/textarea";

export function FaqForm({ initialValues, defaultPage, onCancel, onSaved, readOnly = false }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors } = useForm({
        question: initialValues?.question ?? "",
        answer: initialValues?.answer ?? "",
        page: initialValues?.page ?? defaultPage,
    });

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
                <Label htmlFor="page">Show on</Label>
                <Select value={data.page} onValueChange={(value) => setData("page", value)} disabled={readOnly}>
                    <SelectTrigger id="page">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="contact">Contact</SelectItem>
                        <SelectItem value="membership">Membership</SelectItem>
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
