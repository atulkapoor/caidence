"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { login } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await login(formData);
            if (data.access_token) {
                localStorage.setItem("token", data.access_token);
                toast.success("Welcome back!");
                router.push("/dashboard");
            }
        } catch (error: any) {
            console.error("Login error", error);
            toast.error(error.message || "Invalid credentials");
        } finally {
            setLoading(false);
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

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email Address</label>
                    <input
                        type="email"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Signing in..." : "Sign in"}
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
