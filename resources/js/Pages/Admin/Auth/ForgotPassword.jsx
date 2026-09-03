import { Head, useForm, usePage } from "@inertiajs/react";
import { AuthShell } from "@/Components/AuthShell";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function ForgotPasswordPage() {
    const { status } = usePage().props;
    const { data, setData, post, processing } = useForm({ email: "" });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/forgot-password");
    }

    if (status) {
        return (
            <AuthShell>
                <Head title="Check Your Email — GCFitness Admin" />
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold">Check your email</h1>
                    <p className="text-sm text-muted-foreground">{status}</p>
                    <a href="/admin/login" className="inline-block pt-4 text-sm font-medium text-primary hover:underline">
                        Back to sign in
                    </a>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <Head title="Forgot Password — GCFitness Admin" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Forgot your password?</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Enter your email address and we'll send instructions to reset your password.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        required
                        value={data.email}
                        onChange={(e) => setData("email", e.target.value)}
                    />
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? "Sending…" : "Send reset link"}
                </Button>

                <a href="/admin/login" className="block text-center text-sm font-medium text-primary hover:underline">
                    Back to sign in
                </a>
            </form>
        </AuthShell>
    );
}

ForgotPasswordPage.layout = (page) => page;

export default ForgotPasswordPage;
