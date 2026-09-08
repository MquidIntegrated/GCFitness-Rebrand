import { Head, useForm, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function ChangePasswordPage() {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/account/password", { onSuccess: () => reset() });
    }

    return (
        <>
            <Head title="Change Password — GCFitness Admin" />
            <div className="max-w-sm space-y-6">
                <h1 className="text-2xl font-semibold">Change password</h1>

                {flash?.message && <p className="text-sm text-primary">{flash.message}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current_password">Current password</Label>
                        <Input
                            id="current_password"
                            type="password"
                            autoComplete="current-password"
                            value={data.current_password}
                            onChange={(e) => setData("current_password", e.target.value)}
                        />
                        {errors.current_password && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.current_password}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">New password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                        />
                        {errors.password && (
                            <p role="alert" className="text-sm text-destructive">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">Confirm new password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData("password_confirmation", e.target.value)}
                        />
                    </div>

                    <Button type="submit" disabled={processing}>
                        {processing ? "Saving…" : "Update password"}
                    </Button>
                </form>
            </div>
        </>
    );
}

ChangePasswordPage.layout = (page) => <AdminLayout>{page}</AdminLayout>;

export default ChangePasswordPage;
