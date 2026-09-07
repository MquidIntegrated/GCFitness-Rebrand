import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { Textarea } from "@/Components/ui/textarea";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export function MembershipPlanForm({ initialValues, onCancel, onSaved }) {
    const isEditing = Boolean(initialValues);
    const { data, setData, post, put, processing, errors, isDirty, transform } = useForm({
        name: initialValues?.name ?? "",
        monthly_price: initialValues?.monthly_price ?? 0,
        annual_price: initialValues?.annual_price ?? 0,
        popular: initialValues?.popular ?? false,
        home_features: initialValues?.home_features?.join("\n") ?? "",
        features: initialValues?.features?.join("\n") ?? "",
    });

    useUnsavedChangesGuard(isDirty);

    transform((formData) => ({
        ...formData,
        home_features: formData.home_features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean),
        features: formData.features
            .split("\n")
            .map((f) => f.trim())
            .filter(Boolean),
    }));

    function handleSubmit(e) {
        e.preventDefault();
        const options = { onSuccess: onSaved };
        if (isEditing) {
            put(`/admin/membership-plans/${initialValues.id}`, options);
        } else {
            post("/admin/membership-plans", options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-24">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} />
                {errors.name && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="monthly_price">Monthly price</Label>
                    <Input id="monthly_price" type="number" value={data.monthly_price} onChange={(e) => setData("monthly_price", e.target.value)} />
                    {errors.monthly_price && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.monthly_price}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="annual_price">Annual price (per month, billed yearly)</Label>
                    <Input id="annual_price" type="number" value={data.annual_price} onChange={(e) => setData("annual_price", e.target.value)} />
                    {errors.annual_price && (
                        <p role="alert" className="text-sm text-destructive">
                            {errors.annual_price}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="home_features">Home page preview features (one per line)</Label>
                <Textarea
                    id="home_features"
                    rows={4}
                    value={data.home_features}
                    onChange={(e) => setData("home_features", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">A shorter feature list shown on the Home page's plan preview card.</p>
                {errors.home_features && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.home_features}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea id="features" rows={5} value={data.features} onChange={(e) => setData("features", e.target.value)} />
                {errors.features && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.features}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Switch id="popular" checked={data.popular} onCheckedChange={(checked) => setData("popular", checked)} />
                <Label htmlFor="popular">Mark as &quot;Most popular&quot;</Label>
            </div>

            <div className="fixed inset-x-0 bottom-0 flex justify-end gap-2 border-t border-border bg-background p-4">
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
