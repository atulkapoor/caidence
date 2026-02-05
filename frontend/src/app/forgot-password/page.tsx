"use client";

import { useState, Suspense } from "react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

function ForgotPasswordContent() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Mock API call since real endpoint might not exist yet
            await new Promise(resolve => setTimeout(resolve, 1500));
            // In real implementation: await requestPasswordReset(email);
            setSubmitted(true);
            toast.success("Reset link sent!");
        } catch (error) {
            toast.error("Failed to send reset link. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (submitted) {
        return (
            <AuthLayout>
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Check your email</h2>
                    <p className="text-slate-500 font-medium mb-8">
                        We've sent a password reset link to <strong className="text-slate-900">{email}</strong>.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 font-bold text-slate-900 hover:text-slate-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to sign in
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <div className="mb-8">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Reset Password</h2>
                <p className="text-slate-500 font-medium">
                    Enter your email address and we'll send you instructions to reset your password.
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isLoading ? "Sending link..." : "Send Reset Link"}
                </button>
            </form>
        </AuthLayout>
    );
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ForgotPasswordContent />
        </Suspense>
    );
}
