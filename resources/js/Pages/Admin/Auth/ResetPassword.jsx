import { Head, useForm } from "@inertiajs/react";
import { AuthShell } from "@/Components/AuthShell";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function ResetPasswordPage({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email,
        password: "",
        password_confirmation: "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        if (data.password !== data.password_confirmation) {
            return;
        }
        post("/admin/reset-password");
    }

    const mismatch = data.password_confirmation.length > 0 && data.password !== data.password_confirmation;

    return (
        <AuthShell>
            <Head title="Reset Password — GCFitness Admin" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Reset your password</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Choose a new password below.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password">New password</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password_confirmation">Confirm password</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={data.password_confirmation}
                        onChange={(e) => setData("password_confirmation", e.target.value)}
                    />
                </div>

                {mismatch && (
                    <p role="alert" className="text-sm text-destructive">
                        Passwords do not match.
                    </p>
                )}
                {errors.password && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.password}
                    </p>
                )}
                {errors.token && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.token}
                    </p>
                )}
                {errors.email && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.email}
                    </p>
                )}

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? "Resetting…" : "Reset password"}
                </Button>
            </form>
        </AuthShell>
    );
}

ResetPasswordPage.layout = (page) => page;

export default ResetPasswordPage;
