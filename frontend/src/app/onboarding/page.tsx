"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingProgress, type OnboardingProgress } from "@/lib/api/onboarding";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [progress, setProgress] = useState<OnboardingProgress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
            router.replace("/login");
            return;
        }

        getOnboardingProgress()
            .then((p) => {
                if (p.is_complete) {
                    router.replace("/dashboard");
                } else {
                    setProgress(p);
                }
            })
            .catch(() => router.replace("/login"))
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

    if (!progress) return null;

    return <OnboardingWizard initialProgress={progress} />;
}
