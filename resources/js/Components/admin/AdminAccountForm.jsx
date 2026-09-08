import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

export function AdminAccountForm({ onCancel, onSaved }) {
    const { data, setData, post, processing, errors } = useForm({
        name: "",
        email: "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/admins", { onSuccess: onSaved });
    }

    return (
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
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} />
                {errors.email && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.email}
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? "Creating…" : "Create admin"}
                </Button>
            </div>
        </form>
    );
}
