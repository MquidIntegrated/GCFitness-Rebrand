import { Head, useForm, usePage } from "@inertiajs/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { AuthShell } from "@/Components/AuthShell";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const { status } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    function handleSubmit(e) {
        e.preventDefault();
        post("/admin/login");
    }

    return (
        <AuthShell>
            <Head title="Sign In — GCFitness Admin" />
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold">Welcome back</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sign in to manage your GCFitness website.
                    </p>
                </div>

                {status && (
                    <p className="text-sm text-primary">{status}</p>
                )}

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

                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData("remember", e.target.checked)}
                            className="size-4 rounded border-input"
                        />
                        Remember me
                    </label>
                    <a href="/admin/forgot-password" className="font-medium text-primary hover:underline">
                        Forgot password?
                    </a>
                </div>

                {errors.email && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.email}
                    </p>
                )}
                {errors.password && (
                    <p role="alert" className="text-sm text-destructive">
                        {errors.password}
                    </p>
                )}

                <Button type="submit" className="w-full" disabled={processing}>
                    {processing ? "Signing in…" : "Sign in"}
                </Button>
            </form>
        </AuthShell>
    );
}

LoginPage.layout = (page) => page;

export default LoginPage;
