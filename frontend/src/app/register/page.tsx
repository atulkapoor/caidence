"use client";

import { useState, Suspense } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { register, login, fetchCurrentUser } from "@/lib/api";

function RegisterContent() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await register({
                ...formData,
                role: "brand_admin"
            });

            toast.success("Account created successfully!");

            try {
                const loginData = await login({
                    email: formData.email,
                    password: formData.password
                });
                if (loginData.access_token) {
                    localStorage.setItem("token", loginData.access_token);

                    let user = null;
                    // Store user details for RBAC
                    try {
                        user = await fetchCurrentUser();
                        localStorage.setItem("user", JSON.stringify(user));
                    } catch {
                        // Non-critical fallback
                    }

                    if (!user || !user.is_approved) {
                        router.push("/pending-approval");
                    } else {
                        router.push("/onboarding");
                    }
                }
            } catch {
                toast.info("Please sign in with your new account.");
                router.push("/login");
            }

        } catch (error: any) {
            console.error("Registration error", error);
            toast.error(error.message || "Failed to create account");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Create an account</h2>
                <p className="text-slate-500 font-medium">
                    Start automating your marketing campaigns today.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Full Name</label>
                    <input
                        type="text"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        placeholder="John Doe"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                </div>

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
                    <label className="text-sm font-bold text-slate-700">Password</label>
                    <input
                        type="password"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Creating account..." : "Create Account"}
                </button>
            </form>

            <div className="mt-8 text-center text-sm font-medium text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-600 font-bold hover:underline">
                    Sign in here
                </Link>
            </div>
        </AuthLayout>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
}

