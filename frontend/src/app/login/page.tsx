"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { login, fetchCurrentUser } from "@/lib/api";
import { getOnboardingProgress } from "@/lib/api/onboarding";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = await login({ email, password });
            localStorage.setItem("token", data.access_token);
            toast.success("Welcome back!");

            // Fetch and store user details for RBAC & routing decisions
            let user = null;
            try {
                user = await fetchCurrentUser();
                localStorage.setItem("user", JSON.stringify(user));
            } catch (userErr) {
                console.error("Failed to fetch user details", userErr);
            }

            // Check onboarding status — redirect to onboarding if not complete
            try {
                const onboarding = await getOnboardingProgress();
                if (!onboarding.is_complete) {
                    router.push("/onboarding");
                    return;
                }
            } catch {
                // If onboarding check fails, proceed based on approval status
            }

            // If user is not approved, send to pending-approval page
            if (user && !user.is_approved) {
                router.push("/pending-approval");
                return;
            }

            router.push("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Welcome back</h2>
                <p className="text-slate-500 font-medium">
                    Enter your credentials to access your workspace.
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <input
                        type="email"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-700">Password</label>
                        <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                    <input
                        type="password"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <div className="mt-8 text-center text-sm font-medium text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-indigo-600 font-bold hover:underline">
                    Create free account
                </Link>
            </div>
        </AuthLayout>
    );
}
