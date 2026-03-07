"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { changePassword } from "@/lib/api/auth";
import { getOnboardingProgress } from "@/lib/api/onboarding";

export default function ForcePasswordResetPage() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            await changePassword(currentPassword, newPassword);
            toast.success("Password updated.");
            try {
                const onboarding = await getOnboardingProgress();
                if (!onboarding.is_complete) {
                    router.push("/onboarding");
                    return;
                }
            } catch {
                // Fall back to dashboard when onboarding status can't be loaded.
            }
            router.push("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 mb-2">Reset Your Password</h2>
                <p className="text-slate-500 font-medium">
                    You must change your temporary password before continuing.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Temporary Password</label>
                    <input
                        type="password"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">New Password</label>
                    <input
                        type="password"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                    <input
                        type="password"
                        required
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Updating..." : "Update Password"}
                </button>
            </form>
        </AuthLayout>
    );
}
