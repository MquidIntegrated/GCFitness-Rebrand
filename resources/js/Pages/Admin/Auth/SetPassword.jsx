import { Head, useForm } from "@inertiajs/react";
import { AuthShell } from "@/Components/AuthShell";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function SetPasswordPage() {
    const { data, setData, post, processing, errors } = useForm({
        password: "",
        password_confirmation: "",
    });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/set-password");
    }

    return (
        <AuthShell>
            <Head title="Set New Password — GCFitness Admin" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Set a new password</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        You're signing in with a temporary password. Choose a permanent password to continue.
                    </p>
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

                {errors.password && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.password}
                    </p>
                )}

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? "Saving…" : "Set password and continue"}
                </Button>
            </form>
        </AuthShell>
    );
}

SetPasswordPage.layout = (page) => page;

export default SetPasswordPage;
