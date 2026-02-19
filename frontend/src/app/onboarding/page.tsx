"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingProgress, type OnboardingProgress } from "@/lib/api/onboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Loader2, AlertCircle } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [progress, setProgress] = useState<OnboardingProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            router.replace("/login");
            return;
        }

        getOnboardingProgress()
            .then((p) => {
                console.log("[Onboarding] API response:", JSON.stringify(p));
                if (p.is_complete) {
                    console.log("[Onboarding] Already complete, redirecting to dashboard");
                    router.replace("/dashboard");
                } else {
                    console.log("[Onboarding] Not complete, showing wizard");
                    setProgress(p);
                }
            })
            .catch((err: any) => {
                // Only redirect to login if truly unauthenticated (token invalid/expired)
                if (err?.status === 401) {
                    localStorage.removeItem("token");
                    router.replace("/login");
                } else {
                    setError(err?.message || "Failed to load onboarding. Please try again.");
                }
            })
            .finally(() => setLoading(false));
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">Setting up your workspace...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="text-center max-w-md">
                    <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
                    <p className="text-slate-700 font-semibold mb-2">Something went wrong</p>
                    <p className="text-slate-500 text-sm mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!progress) return null;

    return <OnboardingWizard initialProgress={progress} />;
}
